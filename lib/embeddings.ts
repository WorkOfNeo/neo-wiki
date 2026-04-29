import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "text-embedding-3-small";

export async function embed(text: string): Promise<number[]> {
  const input = text.slice(0, 30_000);
  const res = await openai.embeddings.create({ model: MODEL, input });
  return res.data[0].embedding;
}

export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
