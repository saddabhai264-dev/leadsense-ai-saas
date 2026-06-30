import OpenAI from "openai";

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const openAIModel = process.env.OPENAI_MODEL || "gpt-5-mini";

export function parseModelJson<T>(output: string): T {
  const cleaned = output.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as T;
}
