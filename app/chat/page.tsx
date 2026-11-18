
import { Suspense } from "react";
import NewChatContent from "./newChatCon";









export default function ChatPage() {
  return (
    <Suspense fallback={<div>Creating chat...</div>}>
      <NewChatContent />
    </Suspense>
  );
}