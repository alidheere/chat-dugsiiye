
import { Suspense } from "react";
import NewChatContent from "./[id]/newChatCon";








// import { redirect } from 'next/navigation';
// import { headers } from 'next/headers';
// import { auth } from '../../lib/auth';
// import { createConversation } from '../../lib/chat';

// export default async function NewChatPage() {
//   // Get the authenticated session
//   const session = await auth.api.getSession({
//     headers: await headers()
// })

//   console.log('session found, redirecting to chat', session);


//   if (!session) {
//     // session not found, redirect to login
//     console.log('session not found, redirecting to login', session);
//     redirect('/login');
//   }

//   // Create a new conversation and redirect to it
//   const conversationId = await createConversation(session.user.id);
//   redirect(`/chat/${conversationId}`);
// }



export default function ChatPage() {
  return (
    <Suspense fallback={<div>Creating chat...</div>}>
      <NewChatContent />
    </Suspense>
  );
}