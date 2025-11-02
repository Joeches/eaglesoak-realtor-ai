
// netlify/functions/aiRagSearch.ts
// RAG endpoint: compute embedding (Hugging Face), find top-K chunks from Supabase, call Qrog to synthesize answer.
//
// Environment variables required (Netlify site settings):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY   (server-only!)
// - HF_TOKEN                    (Hugging Face API token)
// - QROG_API_KEY                (Qrog API key)
// - RAG_MATCH_K (optional, number of retrieved chunks; default 4)

import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { HfInference } from "@huggingface/inference";
import fetch from "node-fetch";

type RequestBody = {
  query?: string;
  propertyId?: string | null;
  conversation?: { role: string; content: string }[]; // optional recent messages
  matchK?: number;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const HF_TOKEN = process.env.HF_TOKEN!;
const QROG_API_KEY = process.env.QROG_API_KEY!;
const DEFAULT_MATCH_K = Number(process.env.RAG_MATCH_K || 4);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !HF_TOKEN || !QROG_API_KEY) {
  console.error("Missing one or more required environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const hf = new HfInference(HF_TOKEN);

/**
 * Helper: compute embedding for a given text using Hugging Face embeddings model.
 * Model choice: 'sentence-transformers/all-MiniLM-L6-v2' (fast, good quality).
 * You can change to a different HF model, just ensure embedding dim matches your pgvector.
 */
async function getEmbedding(text: string): Promise<number[]> {
  // Using HfInference client
  // The `embeddings` method returns a vector array for the input text.
  try {
    // model can be adjusted; small models are cheaper (all-MiniLM-L6-v2)
    const model = "sentence-transformers/all-MiniLM-L6-v2";
    const res = await hf.embeddings({ model, input: text });
    // res.data or res depending on library version — HfInference returns object with embedding array usually under 'embedding' or 'data'.
    // The @huggingface/inference client returns a plain array for embeddings calls; check your package version.
    if (Array.isArray(res as any)) {
      return res as number[];
    }
    // Fallback: try known shapes
    // @ts-ignore
    if ((res as any).embedding) return (res as any).embedding as number[];
    // Some older versions return { data: [vector] }
    // @ts-ignore
    if ((res as any).data && Array.isArray((res as any).data[0])) return (res as any).data[0];
    throw new Error("Unexpected embeddings response shape");
  } catch (err) {
    console.error("getEmbedding error:", err);
    throw err;
  }
}

/**
 * Helper: call Qrog with a synthesized prompt and return its textual output.
 * Adjust endpoint & payload if Qrog API changes.
 */
async function callQrog(prompt: string): Promise<any> {
  const endpoint = "https://api.qrog.ai/v1/generate"; // change if Qrog exposes another route (e.g., chat completion)
  const payload = {
    model: "qrog-1.1",
    prompt,
    max_tokens: 400,
    temperature: 0.1,
  };
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${QROG_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Qrog API error: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  return data;
}

/**
 * Main handler
 */
export const handler: Handler = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing request body" }) };
    }

    const body: RequestBody = JSON.parse(event.body);
    const query = (body.query || "").trim();
    const propertyId = body.propertyId || null;
    const matchK = body.matchK ?? DEFAULT_MATCH_K;
    const conversation = body.conversation ?? [];

    if (!query) {
      return { statusCode: 400, body: JSON.stringify({ error: "Query is required" }) };
    }

    // 1) Compute embedding for query
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await getEmbedding(query);
    } catch (err) {
      console.error("Embedding failed:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Embedding generation failed" }) };
    }

    // 2) Retrieve most similar contexts from Supabase vector table
    // NOTE: This code expects you to have a Supabase function/RPC named `match_property_embeddings`
    // that accepts an embedding (float[]) and returns nearest rows with metadata.
    // Example RPC signature (SQL): match_property_embeddings(query_embedding float8[], match_count int)
    //
    // If you don't have the RPC, create one using pgvector extension and a function that computes similarity.
    //
    // The RPC should return rows like: { property_id, metadata (json) }
    let retrievals: any[] = [];
    try {
      // Attempt RPC query
      const rpcName = "match_property_embeddings"; // change if you used another name
      // Many Supabase clients accept arrays directly — pass queryEmbedding as float array
      const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName, {
        query_embedding: queryEmbedding,
        match_count: matchK,
      });
      if (rpcError) {
        console.warn("Supabase RPC match_property_embeddings error:", rpcError.message || rpcError);
        // Fall back to returning empty retrievals; still proceed (Qrog will use property metadata if available)
        retrievals = [];
      } else {
        retrievals = rpcData || [];
      }
    } catch (err) {
      console.error("Vector retrieval RPC failed:", err);
      retrievals = [];
    }

    // 3) Fetch property metadata (if propertyId provided) for context
    let propertyRow: any = null;
    if (propertyId) {
      const { data: prop, error: propError } = await supabase
        .from("properties")
        .select(
          `id, title, description, price, currency, city, district, bedrooms, bathrooms, sqft, amenities, seo_tags, investment_index, market_sentiment`
        )
        .eq("id", propertyId)
        .limit(1)
        .maybeSingle();

      if (prop && !propError) {
        propertyRow = prop;
      } else {
        console.warn("Property not found or error:", propError?.message || propError);
      }
    }

    // 4) Build RAG context
    const contextParts: string[] = [];

    if (propertyRow) {
      contextParts.push(`Property Title: ${propertyRow.title}`);
      if (propertyRow.description) contextParts.push(`Description: ${propertyRow.description}`);
      contextParts.push(`Price: ${propertyRow.currency ?? "NGN"} ${propertyRow.price ?? "N/A"}`);
      if (propertyRow.city) contextParts.push(`Location: ${propertyRow.city}${propertyRow.district ? ", " + propertyRow.district : ""}`);
      if (propertyRow.bedrooms !== undefined) contextParts.push(`Bedrooms: ${propertyRow.bedrooms}`);
      if (propertyRow.bathrooms !== undefined) contextParts.push(`Bathrooms: ${propertyRow.bathrooms}`);
      if (propertyRow.sqft) contextParts.push(`Size (sqft): ${propertyRow.sqft}`);
      if (propertyRow.amenities) contextParts.push(`Amenities: ${(propertyRow.amenities || []).join(", ")}`);
      if (propertyRow.investment_index) contextParts.push(`Investment index: ${propertyRow.investment_index}`);
      if (propertyRow.market_sentiment) contextParts.push(`Market sentiment: ${propertyRow.market_sentiment}`);
    }

    // Include retrievals (documents)
    retrievals.slice(0, matchK).forEach((r: any, idx: number) => {
      // Each retrieval should include metadata.text or metadata.content
      const meta = r.metadata || r;
      const docText = meta.text || meta.content || JSON.stringify(meta);
      contextParts.push(`Context doc ${idx + 1}: ${docText}`);
    });

    // Add recent conversation (optional) so Qrog can be multi-turn aware
    if (conversation.length) {
      contextParts.push("Conversation history:");
      conversation.slice(-6).forEach((m) => {
        contextParts.push(`${m.role === "user" ? "User" : "Assistant"}: ${m.content}`);
      });
    }

    // 5) Build final prompt for Qrog
    const prompt = [
      "You are EaglesOak Realty Assistant, a professional AI designed to answer property questions using ONLY the provided context. Be concise, factual, and include assumptions if you estimate numbers.",
      "-----",
      "Context:",
      ...contextParts,
      "-----",
      `User query: ${query}`,
      "-----",
      "Instructions:",
      "- Use the context above. If the context does not contain enough information, say what additional info you need.",
      "- Provide clear investment insights and risk notes where applicable.",
      "- Keep answer under 220 words and include a 1-2 sentence conclusion with recommended next steps.",
    ].join("\n");

    // 6) Call Qrog
    let qrogResponse: any = null;
    try {
      qrogResponse = await callQrog(prompt);
    } catch (err) {
      console.error("Qrog call failed:", err);
      return { statusCode: 502, body: JSON.stringify({ error: "LLM generation failed" }) };
    }

    // 7) Parse output (Qrog may return different shapes; attempt common paths)
    let answerText = "";
    if (!qrogResponse) {
      answerText = "No answer from LLM.";
    } else if (typeof qrogResponse === "string") {
      answerText = qrogResponse;
    } else if (qrogResponse.output) {
      answerText = qrogResponse.output;
    } else if (qrogResponse.choices?.[0]?.text) {
      answerText = qrogResponse.choices[0].text;
    } else {
      answerText = JSON.stringify(qrogResponse);
    }

    // 8) Return to client
    const payload = {
      answer: answerText,
      contextSummary: contextParts.slice(0, 6), // small subset of used context
      retrievedCount: retrievals.length,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
    };
  } catch (err: any) {
    console.error("aiRagSearch error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "internal_error" }) };
  }
};
