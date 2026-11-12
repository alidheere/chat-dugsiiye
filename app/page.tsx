
"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";

type HistoryItem = {
  _id: string;
  title: string;
  updatedAt: string;
};

type SavedMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const savedAssistantIds = useRef(new Set<string>());

  const {
    messages,
    sendMessage,
    setMessages,
    status,
  } = useChat();

  const isLoading = status === "submitted" || status === "streaming";


// GET all conversations
async function loadHistory() {
  try {
    setLoadingHistory(true);
    setError("");

    const response = await fetch("/api/conversation", {
      method: "GET",
      cache: "no-store",
    });

    const responseText = await response.text();



    if (!response.ok) {
      throw new Error(
        `API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = JSON.parse(responseText);

    if (!data.success) {
      throw new Error(data.message || "Could not load history");
    }

    setHistory(data.conversations ?? []);
  } catch (err) {
    console.error("Load history error:", err);
    setError("History lama soo gelin.");
  } finally {
    setLoadingHistory(false);
  }
}


  useEffect(() => {
    void loadHistory();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // New chat
  function newChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    savedAssistantIds.current.clear();
  }

  // GET one conversation
  async function openConversation(id: string) {
    try {
      setOpening(true);
      setError("");

      const response = await fetch(`/api/conversation/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not open conversation"
        );
      }

      const conversation = data.conversation;

      if (!conversation || !Array.isArray(conversation.messages)) {
        throw new Error("Conversation data is invalid");
      }

      const formattedMessages = conversation.messages.map(
        (message: SavedMessage, index: number) => ({
          id: `${id}-${index}`,
          role: message.role,
          parts: [
            {
              type: "text" as const,
              text: message.content,
            },
          ],
        })
      );

      savedAssistantIds.current.clear();

      conversation.messages.forEach(
        (message: SavedMessage, index: number) => {
          if (message.role === "assistant") {
            savedAssistantIds.current.add(`${id}-${index}`);
          }
        }
      );

      setConversationId(id);
      setMessages(formattedMessages as typeof messages);
      setInput("");
    } catch (err) {
   
      setError(
        err instanceof Error
          ? err.message
          : "Conversation lama furin waayay."
      );
    } finally {
      setOpening(false);
    }
  }

  // DELETE conversation

async function handleDeleteConversation(id: string) {
  try {
    const response = await fetch(`/api/chat-conversation/${id}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.message || `Delete failed: ${response.status}`
      );
    }

    setHistory((previous) =>
      previous.filter((item) => item._id !== id)
    );

    if (conversationId === id) {
      setConversationId(null);
    }

    console.log("Conversation deleted successfully");
  } catch (error) {
    console.error("Delete conversation error:", error);
    setError(
      error instanceof Error
        ? error.message
        : "Conversation lama tirtiri karin."
    );
  }
}



  // SEND user message
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const text = input.trim();

    if (!text || isLoading || saving || opening) return;

    setError("");
    setSaving(true);

    try {
      // Save user message first
      const saveResponse = await fetch("/api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: text,
          role: "user",
        }),
      });

      const savedData = await saveResponse.json();

      if (!saveResponse.ok || !savedData.success) {
        throw new Error(
          savedData.message || "User message could not be saved"
        );
      }

      const activeId =
        savedData.conversationId ??
        savedData.data?.conversationId;

      if (!activeId) {
        throw new Error("Conversation ID missing");
      }

      setConversationId(activeId);
      setInput("");

      // Send message to AI
      await sendMessage(
        { text },
        {
          body: {
            conversationId: activeId,
          },
        }
      );

      await loadHistory();
    } catch (err) {
      console.error("Send message error:", err);
      setError("Fariinta lama diri karin. Mar kale isku day.");
    } finally {
      setSaving(false);
    }
  }

  // SAVE assistant response
  useEffect(() => {
    if (status !== "ready" || !conversationId) return;

    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");

    if (!lastAssistantMessage) return;

    const messageId = lastAssistantMessage.id;

    if (savedAssistantIds.current.has(messageId)) return;

    const text = lastAssistantMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");

    if (!text.trim()) return;

    // Prevent duplicate saving
    savedAssistantIds.current.add(messageId);

    async function saveAssistant() {
      try {
        const response = await fetch("/api/conversation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            message: text,
            role: "assistant",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Assistant response could not be saved"
          );
        }

        await loadHistory();
      } catch (err) {
        savedAssistantIds.current.delete(messageId);
        console.error("Assistant save error:", err);
      }
    }

    void saveAssistant();
  }, [status, messages, conversationId]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">

      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-800 p-4 md:flex">
        <h1 className="mb-6 text-xl font-bold">
          AI Assistant
        </h1>

        <button
          onClick={newChat}
          className="mb-6 w-full rounded-xl bg-blue-600 p-3 font-medium hover:bg-blue-700"
        >
          + New Chat
        </button>

        <h2 className="mb-3 text-sm font-semibold text-gray-400">
          Conversation History
        </h2>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {loadingHistory && (
            <p className="text-sm text-gray-400">
              Loading history...
            </p>
          )}

          {history.map((item) => (
            <div
              key={item._id}
              className={`flex items-center gap-2 rounded-lg p-2 ${
                conversationId === item._id
                  ? "bg-gray-800"
                  : "hover:bg-gray-900"
              }`}
            >
              <button
                onClick={() => openConversation(item._id)}
                disabled={opening}
                className="min-w-0 flex-1 truncate text-left text-sm disabled:opacity-50"
              >
                {item.title}
              </button>

         <button
  onClick={() => handleDeleteConversation(item._id)}
  className="shrink-0 text-red-400 hover:text-red-300 transition-colors"
  title="Delete conversation"
  aria-label="Delete conversation"
>
  ✕
</button>
            </div>
          ))}

          {!loadingHistory && history.length === 0 && (
            <p className="text-sm text-gray-500">
              No conversations yet.
            </p>
          )}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="shrink-0 border-b border-gray-800 p-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Smart AI Assistant
              </h2>

              <p className="text-xs text-gray-400">
                Ask me anything
              </p>
            </div>

            <button
              onClick={newChat}
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700 md:hidden"
            >
              + New Chat
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-4xl space-y-6">

            {messages.length === 0 && (
              <div className="mt-32 text-center">
                <h2 className="mb-3 text-3xl font-bold">
                  How can I help you?
                </h2>

                <p className="text-gray-400">
                  Ask about movies, jokes, database or weather.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`min-w-0 max-w-[95%] overflow-hidden rounded-2xl p-4 md:max-w-[85%] ${
                    message.role === "user"
                      ? "bg-blue-600"
                      : "border border-gray-800 bg-gray-900"
                  }`}
                >
                  <p className="mb-3 text-xs font-semibold text-gray-300">
                    {message.role === "user"
                      ? "You"
                      : "AI Assistant"}
                  </p>

                  <div className="min-w-0 break-words text-sm leading-7 md:text-base">
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <p
                            key={index}
                            className="whitespace-pre-wrap break-words"
                          >
                            {part.text}
                          </p>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400">
                  AI is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mx-auto mb-2 w-full max-w-4xl px-4 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-gray-800 p-4"
        >
          <div className="mx-auto flex max-w-4xl items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Message AI Assistant..."
              disabled={isLoading || saving || opening}
              rows={1}
              className="max-h-40 min-h-12 flex-1 resize-y rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading || saving || opening}
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving || isLoading ? "..." : "Send"}
            </button>
          </div>

          <p className="mx-auto mt-2 max-w-4xl text-center text-xs text-gray-500">
            Enter to send · Shift + Enter for a new line
          </p>
        </form>

      </main>
    </div>
  );
}
