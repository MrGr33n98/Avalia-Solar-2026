import { Suspense } from "react";
import ChatClient from "./ChatClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    }>
      <ChatClient />
    </Suspense>
  );
}
