
import { z } from "zod";
import { connectDB } from "../lib/mongodb";
import Movie from "../models/movie";
import User from "../models/user";


export const databaseToolSchema = z.object({
  action: z.enum([
    "search_movies",
    "search_users",
    "count_movies",
  ]),

  genre: z.string().optional(),

  minRating: z.number().min(0).max(10).optional(),

  minAge: z.number().min(1).optional(),
});

export async function runDatabaseTool(
  input: z.infer<typeof databaseToolSchema>
) {
  const data = databaseToolSchema.parse(input);

  await connectDB();

  switch (data.action) {
    case "search_movies": {
      const filter: Record<string, unknown> = {};

      if (data.genre) {
        filter.genre = {
          $regex: data.genre,
          $options: "i",
        };
      }

      if (data.minRating !== undefined) {
        filter.rating = {
          $gte: data.minRating,
        };
      }

      return Movie.find(filter).limit(20).lean();
    }

    case "search_users": {
      const filter: Record<string, unknown> = {};

      if (data.minAge !== undefined) {
        filter.age = {
          $gte: data.minAge,
        };
      }

      return User.find(filter)
        .select("name age favorite_genre")
        .limit(20)
        .lean();
    }

    case "count_movies": {
      const count = await Movie.countDocuments();

      return { totalMovies: count };
    }
  }
}
