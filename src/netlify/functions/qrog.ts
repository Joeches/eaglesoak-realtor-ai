// netlify/functions/qrog.ts
// Minimal, secure proxy to Qrog API
// Environment required: QROG_API_KEY

import type { Handler } from "@netlify/functions";
import fetch from "node-fetch";

const QROG_API_KEY = process.env.QROG_API_KEY!;
const QROG_ENDPOINT = "https://api.qrog.ai/v1/generate"; // adjust if Qrog docs indicate different path

if (!QROG_API_KEY) {
  console.error("Missing QROG_API_KEY environment variable");
}

export const handler: Handler = async (event) => {
  try {
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: "Missing request body" }) };

    const body = JSON.parse(event.body);
    // Accept either prompt (string) or structured messages (array)
    const { prompt, messages, model = "qrog-1.1", max_tokens = 400, temperature = 0.1 } = body;

    if (!prompt && !messages) {
      return { statusCode: 400, body: JSON.stringify({ error: "Provide prompt or messages" }) };
    }

    // Build Qrog payload
    const payload: any = {};
    if (messages) {
      // messages array form (chat)
      payload.messages = messages;
      payload.model = model;
      payload.max_tokens = max_tokens;
      payload.temperature = temperature;
    } else {
      // single prompt generation
      payload.model = model;
      payload.prompt = prompt;
      payload.max_tokens = max_tokens;
      payload.temperature = temperature;
    }

    const resp = await fetch(QROG_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QROG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    // Forward Qrog response verbatim (client will parse JSON)
    return {
      statusCode: resp.status,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (err: any) {
    console.error("qrog function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "qrog_error" }) };
  }
};
