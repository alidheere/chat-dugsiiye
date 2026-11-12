import { connection } from "next/server";
import { getJoke } from "../../../tools/joke-tool";



export async function GET() {
    await connection();
  try {
    const result = await getJoke({
      category: "dad",
    });

    return Response.json(result);
  } catch (error) {
    console.error("Joke error:", error);

    return Response.json(
      {
        success: false,
        message: "Could not get a joke",
      },
      { status: 500 }
    );
  }
}
