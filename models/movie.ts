
import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  year: {
    type: Number,
    required: true,
  },

  genre: {
    type: String,
    required: true,
    trim: true,
  },

  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },

  director: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    default: "",
  },
});

const Movie =
  mongoose.models.Movie ||
  mongoose.model("Movie", MovieSchema);

export default Movie;
