import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { createConversation } from "../../../lib/chat";



export default async function NewChatContent(): Promise<never> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/singin");
  }

  const conversationId = await createConversation(
    session.user.id
  );

  redirect(`/chat/${conversationId}`);
}