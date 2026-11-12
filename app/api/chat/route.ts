
import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { z } from "zod";

import {
  databaseToolSchema,
  runDatabaseTool,
} from "../../../tools/database-tool";

import {
  movieSearchSchema,
  searchMovies,
} from "../../../tools/movie-tool";

import {
  getMovieDetails,
  movieDetailsSchema,
} from "../../../tools/movie-details-tool";

import {
  getJoke,
  jokeSchema,
} from "../../../tools/joke-tool";

import {
  jokeSearchSchema,
  searchJokes,
} from "../../../tools/joke-search";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openrouter("openai/gpt-4o-mini"),

      system: `
        You are a helpful AI assistant.

        You have access to these tools:

        1. databaseTool:
        Search movies and users stored in MongoDB,
        or count movies in the database.

        2. movieSearch:
        Search movies using the OMDb API by title and year.

        3. movieDetails:
        Get full movie details using an IMDb ID.

        4. jokeTool:
        Get a real dad joke when users ask for jokes
        or funny content.

        5. jokeSearch:
        Search jokes saved in MongoDB by category or keyword.

        6. weather:
        Get current weather information for any city.
        Always use this tool when users ask about:
        - Current weather
        - Temperature
        - Weather conditions
        - Weather forecasts

        Never invent weather information.
        Always explain tool results clearly.
      `,

      messages: await convertToModelMessages(messages),

      tools: {
        // 1. Database Tool
        databaseTool: tool({
          description:
            "Search movies, search users, or count movies in MongoDB",

          inputSchema: databaseToolSchema,

          execute: async (input) => {
            return runDatabaseTool(input);
          },
        }),

        // 2. Movie Search
        movieSearch: tool({
          description:
            "Search movies using OMDb API by title and optional year",

          inputSchema: movieSearchSchema,

          execute: async (input) => {
            return searchMovies(input);
          },
        }),

        // 3. Movie Details
        movieDetails: tool({
          description:
            "Get full movie details using IMDb ID",

          inputSchema: movieDetailsSchema,

          execute: async (input) => {
            return getMovieDetails(input);
          },
        }),

        // 4. Joke Tool
        jokeTool: tool({
          description:
            "Get a real dad joke when users ask for jokes or funny content",

          inputSchema: jokeSchema,

          execute: async (input) => {
            return getJoke(input);
          },
        }),

        // 5. Joke Search
        jokeSearch: tool({
          description:
            "Search saved jokes in MongoDB by category or keyword",

          inputSchema: jokeSearchSchema,

          execute: async (input) => {
            return searchJokes(input);
          },
        }),

        // 6. Weather Tool
        weather: tool({
          description:
            "Get real-time weather information for any city",

          inputSchema: z.object({
            location: z
              .string()
              .describe("City name, for example Juba"),
          }),

          execute: async ({ location }) => {
            const response = await fetch(
              `https://wttr.in/${encodeURIComponent(location)}?format=j1`
            );

            if (!response.ok) {
              throw new Error("Weather service failed");
            }

            const data = await response.json();

            const current = data.current_condition?.[0];

            if (!current) {
              throw new Error("Weather data is unavailable");
            }

            return {
              location,
              temperatureF: current.temp_F,
              temperatureC: current.temp_C,
              condition: current.weatherDesc?.[0]?.value,
              humidity: current.humidity,
              windSpeed: current.windspeedKmph,
            };
          },
        }),
      },

      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      {
        success: false,
        error: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
