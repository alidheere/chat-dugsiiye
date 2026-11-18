
import { createOpenAI } from "@ai-sdk/openai";

import {
  streamText,
  convertToModelMessages,
  validateUIMessages,
  createIdGenerator,
  type UIMessage,
} from "ai";

import {
  getConversation,
  saveChat,
} from "../../../lib/chat";

import { auth } from "../../../lib/auth";

export const maxDuration = 60;


// OpenRouter provider
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    // 2. Request body
    const {
      id: conversationId,
      messages,
    }: {
      id: string;
      messages: UIMessage[];
    } = await req.json();

    if (!conversationId || !Array.isArray(messages)) {
      return new Response("Invalid request body", {
        status: 400,
      });
    }

    // 3. Validate conversation ownership
    const conversation = await getConversation(
      conversationId,
      session.user.id
    );

    if (!conversation) {
      return new Response("Conversation not found", {
        status: 404,
      });
    }

    // 4. Validate UI messages
    const validatedMessages = await validateUIMessages({
      messages,
    });

    // 5. Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(
      validatedMessages
    );

    // 6. Stream AI response
    const result = streamText({
      model: openrouter.chat("openai/gpt-4o"),
      system:
        "You are a helpful AI assistant. Be concise and helpful in your responses.",
      messages: modelMessages,
    });

    // 7. Return streaming response and save messages
    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,

      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),

      onFinish: async ({ messages }) => {
        try {
          await saveChat({
            chatId: conversationId,
            messages,
          });

          console.log("Chat saved successfully");
        } catch (error) {
          console.error("Error saving chat:", error);
        }
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      error instanceof Error
        ? error.message
        : "Internal Server Error",
      { status: 500 }
    );
  }
}
