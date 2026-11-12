
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  movie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },

  comment: {
    type: String,
    required: true,
    trim: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const Review =
  mongoose.models.Review ||
  mongoose.model("Review", ReviewSchema);

export default Review;
