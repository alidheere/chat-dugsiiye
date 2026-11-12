
import { z } from "zod";

export const jokeSchema = z.object({
  category: z.enum([
    "dad",
    "programming",
    "general",
  ]),
});

export async function getJoke(
  input: z.infer<typeof jokeSchema>
) {
  const { category } = jokeSchema.parse(input);

  const response = await fetch(
    "https://icanhazdadjoke.com/",
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Joke API request failed");
  }

  const data = await response.json();

  return {
    success: true,
    category,
    id: data.id,
    joke: data.joke,
  };
}
