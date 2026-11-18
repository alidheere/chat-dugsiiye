import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "../../lib/auth";
import { getConversation, loadChat } from "../../lib/chat";
import Chat from "../components/new-chat";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatContent({
  params,
}: PageProps) {
  // Get conversation ID
  const { id } = await params;

  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/singin");
  }

  // Validate conversation ownership
  const conversation = await getConversation(
    id,
    session.user.id
  );

  if (!conversation) {
    redirect("/chat");
  }

  // Load chat messages
  const initialMessages = await loadChat(id);

  return (
    <Chat
      conversationId={id}
      initialMessages={initialMessages}
      conversationTitle={conversation.title}
    />
  );
}