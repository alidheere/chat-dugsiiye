
import mongoose, { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    title: {
      type: String,
      default: "New Conversation",
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Conversation =
  models.Conversation ||
  model("Conversation", ConversationSchema);

export default Conversation;
