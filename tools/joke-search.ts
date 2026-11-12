
import { z } from "zod";
import { connectDB } from "../lib/mongodb";
import Joke from "../models/joke";


export const jokeSearchSchema = z.object({
  category: z.enum([
    "dad",
    "programming",
    "general",
  ]).optional(),

  keyword: z.string().optional(),

  limit: z.number().min(1).max(50).default(10),
});

export async function searchJokes(
  input: z.infer<typeof jokeSearchSchema>
) {
  const data = jokeSearchSchema.parse(input);

  await connectDB();

  const filter: Record<string, unknown> = {};

  if (data.category) {
    filter.category = data.category;
  }

  if (data.keyword) {
    filter.joke = {
      $regex: data.keyword,
      $options: "i",
    };
  }

  const jokes = await Joke.find(filter)
    .sort({ createdAt: -1 })
    .limit(data.limit)
    .lean();

  return {
    success: true,
    total: jokes.length,
    jokes,
  };
}
