
import mongoose from "mongoose";

const ToolLogSchema = new mongoose.Schema(
  {
    toolName: {
      type: String,
      required: true,
      trim: true,
    },

    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    output: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: ["success", "error"],
      required: true,
    },

    executionTimeMs: {
      type: Number,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ToolLog =
  mongoose.models.ToolLog ||
  mongoose.model("ToolLog", ToolLogSchema);

export default ToolLog;
