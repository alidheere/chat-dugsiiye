
"use client";

import { useEffect, useState } from "react";

type GeneratedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
};

export default function Sidebar() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImages, setShowImages] = useState(false);

  async function loadImages() {
    try {
      setLoading(true);

      const response = await fetch("/api/image", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load images");
      }

      setImages(data.images ?? []);
    } catch (error) {
      console.error("Gallery error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-[#111827] text-white">

      {/* Logo */}
      <div className="border-b border-gray-700 p-5">
        <h1 className="text-xl font-bold">
          AI Studio
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Your AI workspace
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 p-4">

        <button
          onClick={() => {
            setShowImages(false);
            window.location.href = "/chat";
          }}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-left font-medium hover:bg-blue-700"
        >
          + New Chat
        </button>

        <button
          onClick={() => setShowImages(false)}
          className={`w-full rounded-xl px-4 py-3 text-left hover:bg-gray-700 ${
            !showImages ? "bg-gray-700" : ""
          }`}
        >
          💬 Chat History
        </button>

        <button
          onClick={() => {
            setShowImages(true);
            loadImages();
          }}
          className={`w-full rounded-xl px-4 py-3 text-left hover:bg-gray-700 ${
            showImages ? "bg-gray-700" : ""
          }`}
        >
          🖼️ Generated Images
        </button>
      </nav>

      {/* Gallery */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">

        {showImages && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Your Images
              </h2>

              <button
                onClick={loadImages}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Refresh
              </button>
            </div>

            {loading && (
              <p className="text-sm text-gray-400">
                Loading images...
              </p>
            )}

            {!loading && images.length === 0 && (
              <p className="text-sm text-gray-400">
                No images generated yet.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {images.map((image) => (
                <a
                  key={image.id}
                  href={image.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={image.prompt}
                  className="overflow-hidden rounded-lg border border-gray-700 hover:border-blue-500"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    className="aspect-square w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        <p className="text-xs text-gray-400">
          AI Studio · Image Gallery
        </p>
      </div>

    </aside>
  );
}
