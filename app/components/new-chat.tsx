
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Streamdown } from 'streamdown';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import {
  Send,
  Bot,
  User,
  AlertCircle,
  RotateCcw,
  ImagePlus,
  Sparkles,
  Plus,
  MessageSquare,
  Loader2,
  RefreshCw,
  ExternalLink,
  X,
  Images,
  Square,
} from 'lucide-react';

import { useSession } from '../../lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface ChatProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  conversationTitle?: string;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  publicId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function Chat({
  conversationId,
  initialMessages = [],
  conversationTitle,
}: ChatProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [input, setInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageTools, setShowImageTools] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
  } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            id,
            messages,
          },
        };
      },
    }),
  });

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, status]);

  // Load conversations
  async function loadConversations() {
    try {
      setLoadingConversations(true);

      const response = await fetch('/api/conversations', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load conversations');
      }

      setConversations(data.conversations ?? []);
    } catch (error) {
      console.error('Conversations error:', error);
    } finally {
      setLoadingConversations(false);
    }
  }

  // Load images
  async function loadImages() {
    try {
      setLoadingImages(true);

      const response = await fetch('/api/image', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load images');
      }

      setImages(data.images ?? []);
    } catch (error) {
      console.error('Gallery error:', error);
    } finally {
      setLoadingImages(false);
    }
  }

  // Load sidebar data
  useEffect(() => {
    if (session) {
      loadImages();
      loadConversations();
    }
  }, [session]);

  // Generate image
  async function generateImage() {
    if (!imagePrompt.trim() || isGeneratingImage) return;

    try {
      setIsGeneratingImage(true);
      setGeneratedImage('');

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      setGeneratedImage(data.image);
      setImagePrompt('');

      await loadImages();
    } catch (error) {
      console.error('Image generation error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong'
      );
    } finally {
      setIsGeneratingImage(false);
    }
  }

  // Send message
  function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!input.trim() || status !== 'ready') return;

    sendMessage({
      text: input.trim(),
    });

    setInput('');
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900">

      {/* SIDEBAR */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          <div>
            <h1 className="font-bold">AI Studio</h1>
            <p className="text-xs text-slate-500">AI Assistant</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2 p-4">

          <button
            onClick={() => router.push('/chat')}
            className="flex w-full items-center gap-3 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>

          <button
            onClick={() => {
              setShowGallery(false);
              loadConversations();
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
              !showGallery
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Conversations
          </button>

          <button
            onClick={() => {
              setShowGallery(true);
              loadImages();
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
              showGallery
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Images className="h-4 w-4" />
            Image Gallery

            <span className="ml-auto rounded bg-slate-200 px-2 py-0.5 text-xs">
              {images.length}
            </span>
          </button>

        </div>

        {/* SIDEBAR CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">

          {!showGallery ? (
            <div className="mt-4">

              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recent Chats
                </h2>

                <button
                  onClick={loadConversations}
                  disabled={loadingConversations}
                  className="text-slate-400 hover:text-violet-600"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loadingConversations ? 'animate-spin' : ''
                    }`}
                  />
                </button>
              </div>

              {loadingConversations && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                </div>
              )}

              {!loadingConversations && conversations.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No conversations yet.
                </p>
              )}

              <div className="space-y-1">
                {conversations.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => router.push(`/chat/${chat.id}`)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                      pathname === `/chat/${chat.id}`
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                      {chat.title || 'New Conversation'}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          ) : (
            <div className="mt-4">

              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your Images
                </h2>

                <button
                  onClick={loadImages}
                  disabled={loadingImages}
                  className="text-slate-400 hover:text-violet-600"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loadingImages ? 'animate-spin' : ''
                    }`}
                  />
                </button>
              </div>

              {loadingImages && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                </div>
              )}

              {!loadingImages && images.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No images yet.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {images.map((image) => (
                  <a
                    key={image.id}
                    href={image.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={image.prompt}
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="aspect-square w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* USER PROFILE */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">

            <Avatar className="h-9 w-9">
              <AvatarImage src={session.user.image || ''} />

              <AvatarFallback className="bg-violet-600 text-white">
                {session.user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {session.user.name || 'User'}
              </p>

              <p className="truncate text-xs text-slate-500">
                {session.user.email}
              </p>
            </div>

          </div>
        </div>

      </aside>

      {/* MAIN CHAT */}
      <main className="flex min-w-0 flex-1 flex-col">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Bot className="h-5 w-5 text-violet-600" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {conversationTitle || 'AI Assistant'}
              </h2>

              <p className="text-xs text-slate-500">
                Online
              </p>
            </div>

          </div>

          <Button
            onClick={() => router.push('/chat')}
            size="sm"
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Chat
          </Button>

        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">

          <div className="mx-auto max-w-3xl space-y-6">

            {/* EMPTY STATE */}
            {messages.length === 0 && (
              <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                  <Sparkles className="h-7 w-7 text-violet-600" />
                </div>

                <h3 className="text-2xl font-semibold">
                  How can I help you?
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ask a question, learn something new, write code or generate an image.
                </p>

                <div className="mt-7 grid w-full max-w-lg gap-3 sm:grid-cols-2">

                  <button
                    onClick={() => setInput('Explain Next.js App Router')}
                    className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-400 hover:bg-violet-50"
                  >
                    <MessageSquare className="mb-2 h-5 w-5 text-violet-600" />
                    <p className="text-sm font-medium">Learn something</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Explain a topic step by step
                    </p>
                  </button>

                  <button
                    onClick={() => setShowImageTools(true)}
                    className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-400 hover:bg-violet-50"
                  >
                    <ImagePlus className="mb-2 h-5 w-5 text-violet-600" />
                    <p className="text-sm font-medium">Create an image</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Generate an AI image
                    </p>
                  </button>

                </div>
              </div>
            )}

            {/* MESSAGE LIST */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user'
                    ? 'flex-row-reverse'
                    : 'flex-row'
                }`}
              >

                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === 'user' ? (
                    <>
                      <AvatarImage src={session.user.image || ''} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-violet-100 text-violet-600">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={`max-w-[85%] min-w-0 rounded-xl px-4 py-3 text-sm leading-7 ${
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type !== 'text') return null;

                    if (message.role === 'assistant') {
                      return (
                        <Streamdown
                          key={index}
                          className="prose prose-sm max-w-none"
                          parseIncompleteMarkdown={true}
                        >
                          {part.text}
                        </Streamdown>
                      );
                    }

                    return (
                      <span key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </span>
                    );
                  })}
                </div>

              </div>
            ))}

            {/* LOADING */}
            {(status === 'submitted' || status === 'streaming') && (
              <div className="flex items-center gap-3">

                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-100 text-violet-600">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">

                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />

                  <span className="text-xs text-slate-500">
                    AI is responding...
                  </span>

                  <button
                    onClick={stop}
                    className="flex items-center gap-1 text-xs text-red-500"
                  >
                    <Square className="h-3 w-3" />
                    Stop
                  </button>

                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-semibold">
                    Something went wrong
                  </p>
                </div>

                <p className="mt-2 text-xs text-red-600">
                  {error.message || 'Please try again.'}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-3"
                >
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Retry
                </Button>

              </div>
            )}

            <div ref={messagesEndRef} />

          </div>
        </div>

        {/* GENERATED IMAGE */}
        {generatedImage && (
          <div className="mx-auto w-full max-w-3xl px-4 pb-4">

            <div className="relative rounded-xl border border-slate-200 bg-white p-3">

              <button
                onClick={() => setGeneratedImage('')}
                className="absolute right-5 top-5 rounded-full bg-black/60 p-2 text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <img
                src={generatedImage}
                alt="AI generated image"
                className="max-h-[350px] w-full rounded-lg object-contain"
              />

              <div className="flex justify-end pt-3">
                <a
                  href={generatedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-violet-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open image
                </a>
              </div>

            </div>
          </div>
        )}

        {/* COMPOSER */}
        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">

          <div className="mx-auto max-w-3xl">

            {/* IMAGE GENERATOR */}
            {showImageTools && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div className="mb-3 flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-violet-600" />
                    <h3 className="text-sm font-semibold">
                      AI Image Generator
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowImageTools(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>

                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    generateImage();
                  }}
                  className="flex flex-col gap-2 sm:flex-row"
                >

                  <input
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe your image..."
                    disabled={isGeneratingImage}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />

                  <Button
                    type="submit"
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    className="bg-violet-600 text-white hover:bg-violet-700"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>

                </form>
              </div>
            )}

            {/* CHAT INPUT */}
            <form onSubmit={handleSendMessage}>

              <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-violet-400">

                <button
                  type="button"
                  onClick={() => setShowImageTools(!showImageTools)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    showImageTools
                      ? 'bg-violet-100 text-violet-600'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title="Create image"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();

                      if (input.trim() && status === 'ready') {
                        sendMessage({ text: input.trim() });
                        setInput('');
                      }
                    }
                  }}
                  placeholder="Message AI Assistant..."
                  rows={1}
                  disabled={status !== 'ready'}
                  className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                />

                <Button
                  type="submit"
                  disabled={status !== 'ready' || !input.trim()}
                  className="h-10 w-10 shrink-0 bg-violet-600 p-0 text-white hover:bg-violet-700"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>

              </div>

              <p className="mt-2 text-center text-xs text-slate-400">
                AI can make mistakes. Check important information.
              </p>

            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
