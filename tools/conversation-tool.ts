
import { connectDB } from "../lib/mongodb";
import Conversation from "../models/conversation";
import mongoose from "mongoose";

export async function getConversations() {
  await connectDB();

  const conversations = await Conversation.find()
    .sort({ updatedAt: -1 })
    .select("title messages createdAt updatedAt")
    .lean();

  return conversations;
}

export async function getConversation({
  conversationId,
}: {
  conversationId: string;
}) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error("Invalid conversation ID");
  }

  const conversation = await Conversation.findById(conversationId).lean();

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

export async function saveConversation({
  conversationId,
  message,
  role,
}: {
  conversationId?: string;
  message: string;
  role: "user" | "assistant";
}) {
  await connectDB();

  let conversation;

  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("Invalid conversation ID");
    }

    conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }
  } else {
    conversation = new Conversation({
      title: message.slice(0, 50),
      messages: [],
    });
  }

  conversation.messages.push({
    role,
    content: message,
    createdAt: new Date(),
  });

  await conversation.save();

  return {
    success: true,
    conversationId: conversation._id.toString(),
  };
}

export async function deleteConversation({
  conversationId,
}: {
  conversationId: string;
}) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error("Invalid conversation ID");
  }

  const conversation =
    await Conversation.findByIdAndDelete(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return {
    success: true,
    message: "Conversation deleted successfully",
  };
}
