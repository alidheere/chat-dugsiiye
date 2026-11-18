
import type { UIMessage } from "ai";
import { eq, asc } from "drizzle-orm";

import { db } from "../../db/drizzle";
import { conversation, messages } from "../../db/schema";

// LOAD CHAT
export async function loadChat(
  conversationId: string
): Promise<UIMessage[]> {
  const messageRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return messageRows.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [
      {
        type: "text" as const,
        text: msg.content,
      },
    ],
  }));
}

/**
 * Legacy function for backward compatibility
 */
export async function loadMessages(
  conversationId: string
): Promise<UIMessage[]> {
  return loadChat(conversationId);
}

/**
 * SAVE CHAT
 */
export async function saveChat({
  chatId,
  messages: chatMessages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  // Check conversation exists
  const [conv] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, chatId))
    .limit(1);

  if (!conv) {
    throw new Error("Conversation not found");
  }

  // Get existing message IDs
  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, chatId));

  const existingIds = new Set(
    existingMessages.map((msg) => msg.id)
  );

  // Filter new messages
  const newMessages = chatMessages.filter(
    (msg) => !existingIds.has(msg.id)
  );

  // Insert new messages
  if (newMessages.length > 0) {
    const messageData = newMessages.map((msg) => {
      const textPart = msg.parts.find(
        (part) => part.type === "text"
      );

      const content =
        textPart?.type === "text" ? textPart.text : "";

      if (
        msg.role !== "user" &&
        msg.role !== "assistant" &&
        msg.role !== "system"
      ) {
        throw new Error(`Unsupported message role: ${msg.role}`);
      }

      return {
        id: msg.id,
        conversationId: chatId,
        role: msg.role,
        content,
      };
    });

    await db.insert(messages).values(messageData);
  }

  // Update conversation timestamp
  await db
    .update(conversation)
    .set({ updatedAt: new Date() })
    .where(eq(conversation.id, chatId));
}

/**
 * Legacy function for backward compatibility
 */
export async function saveMessages(
  conversationId: string,
  chatMessages: UIMessage[],
  userId: string
): Promise<void> {
  // userId is retained for backward compatibility.
  return saveChat({
    chatId: conversationId,
    messages: chatMessages,
  });
}
