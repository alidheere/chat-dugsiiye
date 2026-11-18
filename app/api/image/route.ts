
import { auth } from "../../../lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { db } from "../../../db/drizzle";
import { generatedImages } from "../../../db/schema";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";

export const maxDuration = 120;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST: Generate and save image
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return Response.json(
        { error: "Please enter an image prompt" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    // Generate image using OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/images",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "bytedance-seed/seedream-4.5",
          prompt: prompt.trim(),
          aspect_ratio: "1:1",
          resolution: "2K",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: data.error?.message || "Image generation failed",
        },
        { status: response.status }
      );
    }

    // Get generated image
    const generatedImage = data.data?.[0];

    if (!generatedImage?.b64_json) {
      throw new Error("No image returned from OpenRouter");
    }

    // Convert Base64 to image data
    const imageData = `data:${
      generatedImage.media_type || "image/png"
    };base64,${generatedImage.b64_json}`;

    // Upload to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(
      imageData,
      {
        folder: "ai-chat-images",
        resource_type: "image",
      }
    );

    // Save to Neon database
    await db.insert(generatedImages).values({
      id: nanoid(),
      userId: session.user.id,
      prompt: prompt.trim(),
      imageUrl: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
    });

    return Response.json({
      success: true,
      image: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
    });

  } catch (error) {
    console.error("Image API error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong generating the image",
      },
      { status: 500 }
    );
  }
}

// GET: Load user's previous images
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const images = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, session.user.id))
      .orderBy(desc(generatedImages.createdAt));

    return Response.json({
      success: true,
      images,
    });

  } catch (error) {
    console.error("Load images error:", error);

    return Response.json(
      { error: "Failed to load images" },
      { status: 500 }
    );
  }
}
