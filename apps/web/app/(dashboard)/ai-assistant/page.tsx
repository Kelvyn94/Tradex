import type { Metadata } from "next";
import { ChatView } from "@/components/ai/chat-view";
import { WidgetErrorBoundary } from "@/components/boundaries/widget-error-boundary";

export const metadata: Metadata = { title: "AI Assistant — TRADEX" };

export default function AIAssistantPage() {
  return (
    <WidgetErrorBoundary label="AI Assistant">
      <ChatView />
    </WidgetErrorBoundary>
  );
}
