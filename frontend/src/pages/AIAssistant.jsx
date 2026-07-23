// pages/AIAssistant.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../api/client";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("ai_chat_history");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
    // Default welcome message
    setMessages([
      {
        role: "assistant",
        content:
          "👋 Hello! I'm your AI trading assistant powered by Groq. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        "ai_chat_history",
        JSON.stringify(messages.slice(-100)),
      );
    }
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        messages: [...messages, userMessage],
      });
      const data = response.data;
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Error: " + data.error,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Error: " + error.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  // Clear history
  const clearHistory = useCallback(() => {
    if (window.confirm("Clear all chat history?")) {
      localStorage.removeItem("ai_chat_history");
      setMessages([
        {
          role: "assistant",
          content: "🗑️ Chat history cleared. How can I help you?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Quick suggestions
  const quickSuggestions = [
    "Analyze EURUSD price action",
    "Explain ICT concepts",
    "What's the market sentiment?",
    "Show me SMT divergence",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            AI Trading Assistant
          </h1>
          <p className="text-gray-400 text-sm">
            Powered by Groq AI • Llama 3.3 70B
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Clear history"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden bg-dark-800/30 rounded-2xl border border-dark-700">
        <div className="h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 animate-slide-up ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user" ? "bg-blue-500/20" : "bg-cyan-500/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={16} className="text-blue-400" />
                  ) : (
                    <Bot size={16} className="text-cyan-400" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-500/20 border border-blue-500/20"
                      : "glass-light"
                  }`}
                >
                  <div className="text-sm text-white whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <div className="mt-1 text-[10px] text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Loader2 size={16} className="text-cyan-400 animate-spin" />
                </div>
                <div className="glass-light p-4 rounded-2xl">
                  <div className="text-sm text-gray-400">
                    Analyzing market data...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-dark-700">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-dark-700 bg-dark-900/30">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about market analysis, ICT concepts, or trading strategies..."
                className="input-premium flex-1 transition-all duration-200 focus:border-blue-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <Send size={18} />
                Send
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-gray-500">
              <span>🔒 Private & secure • Powered by Groq AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
