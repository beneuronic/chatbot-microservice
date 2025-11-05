import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ No OPENAI_API_KEY found in environment — using fallback mode");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
