"use client";

import * as React from "react";
import { Bot, ChevronDown, ChevronUp, Loader2, Send, Trash2, User } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const HISTORY_KEY = "ai_chat_history";
const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "👋 Hello! I'm your AI trading assistant powered by Groq. How can I help you today?",
  timestamp: new Date().toISOString(),
};

const QUICK_SUGGESTIONS = [
  "Analyze EURUSD price action",
  "Explain ICT concepts",
  "What's the market sentiment?",
  "Show me SMT divergence",
];

export function ChatView() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch {
        // fall through to welcome message
      }
    }
    setMessages([WELCOME_MESSAGE]);
  }, []);

  React.useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-100)));
    }
  }, [messages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = React.useCallback(
    async (overrideInput?: string) => {
      const text = (overrideInput ?? input).trim();
      if (!text || loading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);

      try {
        const data = await clientApi<{ success: boolean; response?: string; error?: string }>(
          "/ai/chat",
          { method: "POST", body: JSON.stringify({ messages: nextMessages }) },
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.success ? (data.response ?? "") : `❌ Error: ${data.error}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Error: ${error instanceof Error ? error.message : "Request failed"}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  function clearHistory() {
    if (!window.confirm("Clear all chat history?")) return;
    localStorage.removeItem(HISTORY_KEY);
    setMessages([
      {
        role: "assistant",
        content: "🗑️ Chat history cleared. How can I help you?",
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
            <Bot className="h-6 w-6 text-primary" /> AI Trading Assistant
          </h1>
          <p className="text-sm text-muted-foreground">Powered by Groq AI • Llama 3.3 70B</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Clear history"
            onClick={clearHistory}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <span className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-sm text-success">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Online
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/30">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn("flex items-start gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "user" ? "bg-primary/20" : "bg-cyan-500/20",
                )}
              >
                {msg.role === "user" ? (
                  <User size={16} className="text-primary" />
                ) : (
                  <Bot size={16} className="text-cyan-400" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl p-4",
                  msg.role === "user"
                    ? "border border-primary/20 bg-primary/10"
                    : "border border-border bg-card",
                )}
              >
                <div className="whitespace-pre-wrap text-sm text-foreground">{msg.content}</div>
                {msg.timestamp && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex animate-pulse items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                <Loader2 size={16} className="animate-spin text-cyan-400" />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Analyzing market data...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-background/40 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about market analysis, ICT concepts, or trading strategies..."
              disabled={loading}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send size={16} /> Send
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            🔒 Private & secure • Powered by Groq AI
          </div>
        </div>
      </div>
    </div>
  );
}
