import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Please send some text to summarize." },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `Summarize the following text in 2 short sentences:\n\n${text}`
    });

    const summary = response.output_text?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: "No summary was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize route failed:", error);

    return NextResponse.json(
      { error: "Failed to summarize the text." },
      { status: 500 }
    );
  }
}
