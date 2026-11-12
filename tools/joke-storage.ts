
import { z } from "zod";
import { connectDB } from "../lib/mongodb";
import Joke from "../models/joke";

export const saveJokeSchema = z.object({
  joke: z.string().min(1),
  category: z.enum([
    "dad",
    "programming",
    "general",
  ]),
});

export async function saveJoke(
  input: z.infer<typeof saveJokeSchema>
) {
  const data = saveJokeSchema.parse(input);

  await connectDB();

  // Check if joke already exists
  const existingJoke = await Joke.findOne({
    joke: data.joke,
  });

  if (existingJoke) {
    return {
      success: true,
      message: "Joke already exists",
      joke: existingJoke,
    };
  }

  // Save new joke
  const newJoke = await Joke.create({
    joke: data.joke,
    category: data.category,
  });

  return {
    success: true,
    message: "Joke saved successfully",
    joke: newJoke,
  };
}
