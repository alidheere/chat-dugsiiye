import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const { text } = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt,
    });

    return Response.json({ text });
  } catch (error) {
    console.error("AI Error:", error);

    return Response.json(
      { error: "AI generation failed" },
      { status: 500 }
    );
  }
}