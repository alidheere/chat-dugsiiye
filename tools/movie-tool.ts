
import { z } from "zod";

const OMDB_API_KEY = process.env.OMDB_API_KEY;

export const movieSearchSchema = z.object({
  title: z.string().min(1, "Movie title is required"),
  year: z.number().optional(),
});

export async function searchMovies(
  input: z.infer<typeof movieSearchSchema>
) {
  const { title, year } = movieSearchSchema.parse(input);

  if (!OMDB_API_KEY) {
    throw new Error("OMDB_API_KEY is missing");
  }

  const params = new URLSearchParams({
    apikey: OMDB_API_KEY,
    s: title,
    type: "movie",
  });

  if (year) {
    params.set("y", String(year));
  }

  const response = await fetch(
    `https://www.omdbapi.com/?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("OMDb API request failed");
  }

  const data = await response.json();

  if (data.Response === "False") {
    return {
      success: false,
      message: data.Error,
      movies: [],
    };
  }

  return {
    success: true,
    totalResults: Number(data.totalResults),
    movies: data.Search.map((movie: {
      Title: string;
      Year: string;
      imdbID: string;
      Poster: string;
      Type: string;
    }) => ({
      title: movie.Title,
      year: movie.Year,
      imdbID: movie.imdbID,
      poster: movie.Poster,
      type: movie.Type,
    })),
  };
}
