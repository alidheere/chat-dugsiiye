import { Suspense } from "react";
import ChatContent from "./chatContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatContent params={params} />
    </Suspense>
  );
}