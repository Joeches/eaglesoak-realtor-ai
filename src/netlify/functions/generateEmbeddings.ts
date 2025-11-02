// netlify/functions/generateEmbeddings.ts
//
// PURPOSE:
// - Periodically index new property descriptions into the property_embeddings table.
// - Uses Hugging Face embeddings model + Supabase vector storage.
//
// REQUIREMENTS:
// - Supabase tables: `properties` and `property_embeddings` (pgvector enabled).
// - Environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   HF_TOKEN
//
// Optional:
//   EMBEDDING_MODEL (defaults to sentence-transformers/all-MiniLM-L6-v2)
//   EMBEDDING_BATCH_SIZE (defaults to 10)

import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { HfInference } from "@huggingface/inference";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const HF_TOKEN = process.env.HF_TOKEN!;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 10);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !HF_TOKEN) {
  console.error("❌ Missing environment variables for embeddings generation.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const hf = new HfInference(HF_TOKEN);

/**
 * Helper: Generate embedding vector for text using Hugging Face Inference API
 */
async function generateEmbeddingForText(text: string): Promise<number[]> {
  if (!text || !text.trim()) throw new Error("Empty text cannot be embedded");
  try {
    const res = await hf.embeddings({
      model: EMBEDDING_MODEL,
      input: text,
    });

    if (Array.isArray(res)) return res;
    // @ts-ignore
    if (res.embedding) return res.embedding;
    // @ts-ignore
    if (res.data && Array.isArray(res.data[0])) return res.data[0];

    throw new Error("Unexpected embedding format");
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw error;
  }
}

/**
 * Handler: fetch properties missing embeddings, compute, and upsert.
 */
export const handler: Handler = async () => {
  try {
    console.log("🚀 Starting embeddings generation...");

    // 1️⃣ Fetch properties without embeddings
    const { data: unembeddedProps, error: fetchError } = await supabase
      .from("properties")
      .select("id, title, description, city, district, price, bedrooms, bathrooms")
      .limit(1000); // adjust as needed or use filters

    if (fetchError) throw fetchError;
    if (!unembeddedProps || unembeddedProps.length === 0)
      return { statusCode: 200, body: JSON.stringify({ message: "No properties found." }) };

    // 2️⃣ Retrieve already embedded property IDs
    const { data: embeddedData, error: embError } = await supabase
      .from("property_embeddings")
      .select("property_id");
    if (embError) throw embError;

    const alreadyEmbeddedIds = new Set(embeddedData?.map((e) => e.property_id));

    // Filter those not yet embedded
    const toEmbed = unembeddedProps.filter((p) => !alreadyEmbeddedIds.has(p.id));
    console.log(`🧠 Found ${toEmbed.length} new properties to embed`);

    if (toEmbed.length === 0)
      return { statusCode: 200, body: JSON.stringify({ message: "All properties already embedded." }) };

    // 3️⃣ Process in batches
    let embeddedCount = 0;
    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE);

      console.log(`📦 Processing batch ${i / BATCH_SIZE + 1} (${batch.length} properties)...`);

      const embeddings: { property_id: string; embedding: number[]; metadata: any }[] = [];

      for (const property of batch) {
        try {
          const textForEmbedding = [
            property.title || "",
            property.description || "",
            property.city || "",
            property.district || "",
            `Price: ${property.price || "N/A"}`,
            `${property.bedrooms || "?"} beds, ${property.bathrooms || "?"} baths`,
          ]
            .join(" ")
            .trim();

          if (!textForEmbedding) continue;

          const vector = await generateEmbeddingForText(textForEmbedding);

          embeddings.push({
            property_id: property.id,
            embedding: vector,
            metadata: {
              title: property.title,
              description: property.description,
              city: property.city,
              district: property.district,
              price: property.price,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              created_at: new Date().toISOString(),
            },
          });

          embeddedCount++;
        } catch (err) {
          console.error(`❌ Failed embedding for property ${property.id}:`, err);
          continue; // continue next property
        }
      }

      // 4️⃣ Upsert batch into property_embeddings table
      if (embeddings.length > 0) {
        const { error: insertError } = await supabase.from("property_embeddings").upsert(embeddings);
        if (insertError) {
          console.error("❌ Insert error:", insertError);
        } else {
          console.log(`✅ Inserted ${embeddings.length} embeddings.`);
        }
      }
    }

    console.log(`🎯 Total embedded: ${embeddedCount}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Embedded ${embeddedCount} properties successfully.` }),
    };
  } catch (err: any) {
    console.error("🔥 Embedding generation failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

