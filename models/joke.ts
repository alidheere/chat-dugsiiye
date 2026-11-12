
import mongoose from "mongoose";

const JokeSchema = new mongoose.Schema({
  joke: {
    type: String,
    required: true,
    trim: true,
  },

  category: {
    type: String,
    enum: ["dad", "programming", "general"],
    default: "dad",
  },

  likes: {
    type: Number,
    default: 0,
  },

  dislikes: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Joke =
  mongoose.models.Joke ||
  mongoose.model("Joke", JokeSchema);

export default Joke;
