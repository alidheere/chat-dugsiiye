
import { connection } from "next/server";
import { searchMovies } from "../../../tools/movie-tool";



export async function GET() {
    await connection();
  try {
    const result = await searchMovies({
      title: "Batman",
    });

    return Response.json(result);
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Movie search failed" },
      { status: 500 }
    );
  }
}
