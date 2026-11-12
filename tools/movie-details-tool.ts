
import { z } from "zod";

const OMDB_API_KEY = process.env.OMDB_API_KEY;

export const movieDetailsSchema = z.object({
  imdbID: z.string().min(1).describe(
    "IMDb ID of the movie, for example tt0133093"
  ),
});

export async function getMovieDetails(
  input: z.infer<typeof movieDetailsSchema>
) {
  const { imdbID } = movieDetailsSchema.parse(input);

  if (!OMDB_API_KEY) {
    throw new Error("OMDB_API_KEY is missing");
  }

  const params = new URLSearchParams({
    apikey: OMDB_API_KEY,
    i: imdbID,
    plot: "full",
  });

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
    };
  }

  return {
    success: true,
    movie: {
      title: data.Title,
      year: data.Year,
      rated: data.Rated,
      released: data.Released,
      runtime: data.Runtime,
      genre: data.Genre,
      director: data.Director,
      writer: data.Writer,
      actors: data.Actors,
      plot: data.Plot,
      language: data.Language,
      country: data.Country,
      awards: data.Awards,
      poster: data.Poster,
      imdbRating: data.imdbRating,
      imdbVotes: data.imdbVotes,
      imdbID: data.imdbID,
    },
  };
}
