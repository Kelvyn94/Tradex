// import React, { useState, useRef, useEffect } from "react";
// import {
//   Bot,
//   Send,
//   X,
//   Sparkles,
//   MessageCircle,
//   TrendingUp,
//   TrendingDown,
//   Minus,
//   Zap,
// } from "lucide-react";
// import api from "../../api/client";
// import toast from "react-hot-toast";

// const AIChat = ({ isOpen, onClose }) => {
//   const [messages, setMessages] = useState([
//     {
//       id: 1,
//       sender: "ai",
//       text: "👋 Hello! I'm your **TRADEX AI Assistant**. I specialize in ICT concepts, SMT divergence, timeframe alignment, and market analysis. Ask me anything about trading!",
//     },
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [context, setContext] = useState({
//     instrument: "XAUUSD",
//     timeframe: "4H",
//     tradeCount: 0,
//     sentiment: "Neutral",
//   });
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     fetchContext();
//     scrollToBottom();
//   }, []);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const fetchContext = async () => {
//     try {
//       const [statsRes, sentimentRes] = await Promise.all([
//         api.get("/trades/stats"),
//         api.get("/sentiment/XAUUSD"),
//       ]);

//       setContext((prev) => ({
//         ...prev,
//         tradeCount: statsRes.data?.total || 0,
//         sentiment:
//           sentimentRes.data?.data?.synthesis?.overallSentiment || "Neutral",
//       }));
//     } catch (error) {
//       // Silent fail
//     }
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleSend = async () => {
//     if (!input.trim()) return;

//     const userMessage = {
//       id: messages.length + 1,
//       sender: "user",
//       text: input,
//     };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setLoading(true);

//     try {
//       // ✅ CORRECT API CALL - uses /ai/chat endpoint
//       const response = await api.post("/ai/chat", {
//         message: input,
//         context: context,
//       });

//       const aiMessage = {
//         id: messages.length + 2,
//         sender: "ai",
//         text:
//           response.data.response ||
//           "I understand your question. Could you provide more details about the setup you're analyzing?",
//       };
//       setMessages((prev) => [...prev, aiMessage]);
//     } catch (error) {
//       console.error("Chat error:", error);
//       // Fallback to local response
//       const fallbackResponse =
//         "I'm having trouble connecting to the AI service. Let me use my local knowledge: In ICT trading, always start with higher timeframe bias (Weekly/Daily), then work down to 4H for structure and 1H/15min for entries. What specific asset or setup are you looking at?";
//       const aiMessage = {
//         id: messages.length + 2,
//         sender: "ai",
//         text: fallbackResponse,
//       };
//       setMessages((prev) => [...prev, aiMessage]);
//       toast.error("AI service temporarily unavailable");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const quickSuggestions = [
//     { label: "SMT Divergence", icon: <TrendingUp className="w-3 h-3" /> },
//     { label: "Order Block", icon: <Zap className="w-3 h-3" /> },
//     { label: "Timeframe Alignment", icon: <Minus className="w-3 h-3" /> },
//     { label: "FVG", icon: <TrendingDown className="w-3 h-3" /> },
//   ];

//   if (!isOpen) return null;

//   return (
//     <div className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[650px] bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-gradient-to-r from-dark-900 to-dark-800">
//         <div className="flex items-center gap-2">
//           <div className="p-2 bg-accent/10 rounded-lg">
//             <Bot className="w-5 h-5 text-accent" />
//           </div>
//           <div>
//             <h3 className="text-white font-medium text-sm">TRADEX AI</h3>
//             <div className="flex items-center gap-1.5">
//               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
//               <span className="text-xs text-gray-400">ICT Expert • Online</span>
//             </div>
//           </div>
//         </div>
//         <button
//           onClick={onClose}
//           className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
//         >
//           <X className="w-4 h-4 text-gray-400" />
//         </button>
//       </div>

//       {/* Context Bar */}
//       <div className="px-4 py-2 bg-dark-900/50 border-b border-dark-700 flex items-center gap-3 text-xs">
//         <span className="text-gray-500">Context:</span>
//         <span className="text-accent">{context.instrument}</span>
//         <span className="text-gray-600">|</span>
//         <span className="text-gray-300">{context.timeframe}</span>
//         <span className="text-gray-600">|</span>
//         <span
//           className={`${context.sentiment === "BULLISH" ? "text-green-500" : context.sentiment === "BEARISH" ? "text-red-500" : "text-yellow-500"}`}
//         >
//           Sentiment: {context.sentiment}
//         </span>
//         <span className="text-gray-600">|</span>
//         <span className="text-gray-400">{context.tradeCount} trades</span>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30 max-h-[380px]">
//         {messages.map((msg) => (
//           <div
//             key={msg.id}
//             className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
//           >
//             <div
//               className={`max-w-[85%] p-3 rounded-2xl ${
//                 msg.sender === "user"
//                   ? "bg-accent text-dark-900 rounded-br-sm"
//                   : "bg-dark-700 text-gray-200 rounded-bl-sm"
//               }`}
//             >
//               {msg.sender === "ai" && (
//                 <div className="flex items-center gap-1.5 mb-1.5">
//                   <Sparkles className="w-3.5 h-3.5 text-accent" />
//                   <span className="text-xs text-gray-400 font-medium">
//                     Assistant
//                   </span>
//                 </div>
//               )}
//               <p className="text-sm leading-relaxed whitespace-pre-wrap">
//                 {msg.text}
//               </p>
//             </div>
//           </div>
//         ))}
//         {loading && (
//           <div className="flex justify-start">
//             <div className="bg-dark-700 p-4 rounded-2xl rounded-bl-sm">
//               <div className="flex gap-1.5">
//                 <div
//                   className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                   style={{ animationDelay: "0ms" }}
//                 />
//                 <div
//                   className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                   style={{ animationDelay: "150ms" }}
//                 />
//                 <div
//                   className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                   style={{ animationDelay: "300ms" }}
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Quick Suggestions */}
//       <div className="px-4 py-2 border-t border-dark-700 bg-dark-900/50">
//         <div className="flex gap-2 overflow-x-auto pb-1">
//           {quickSuggestions.map((item) => (
//             <button
//               key={item.label}
//               onClick={() => {
//                 setInput(`Explain ${item.label} to me`);
//                 // Need to trigger send after setting input
//                 setTimeout(() => handleSend(), 100);
//               }}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 text-xs rounded-full transition-colors whitespace-nowrap border border-dark-600"
//             >
//               {item.icon}
//               {item.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Input */}
//       <div className="p-4 border-t border-dark-700 bg-dark-900">
//         <div className="flex gap-2">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyPress={(e) => e.key === "Enter" && handleSend()}
//             placeholder="Ask about ICT, SMT, or any trading question..."
//             className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm"
//             disabled={loading}
//           />
//           <button
//             onClick={handleSend}
//             disabled={loading || !input.trim()}
//             className="p-2.5 bg-accent text-dark-900 rounded-xl hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <Send className="w-5 h-5" />
//           </button>
//         </div>
//         <div className="mt-1.5 text-[10px] text-gray-500 text-center flex items-center justify-center gap-2">
//           <span>🔒 Private & secure</span>
//           <span>•</span>
//           <span>⚡ Powered by DeepSeek AI</span>
//           <span>•</span>
//           <span>📊 ICT optimized</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AIChat;

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from "lucide-react";
import api from "../../api/client";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

// ============================================
// 1. ERROR BOUNDARY COMPONENT
// ============================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AI Chat Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-4 right-4 z-50 w-[420px] bg-dark-800/95 backdrop-blur-sm border border-red-500/30 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Bot className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-white font-medium">Something went wrong</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            The AI chat encountered an error. Please try again or refresh the
            page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-dark-900 rounded-lg text-sm font-medium hover:bg-accent/80 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// 2. UTILITY FUNCTIONS
// ============================================
const generateMessageId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

const getSentimentColor = (sentiment) => {
  switch (sentiment?.toUpperCase()) {
    case "BULLISH":
      return "text-green-500";
    case "BEARISH":
      return "text-red-500";
    default:
      return "text-yellow-500";
  }
};

// ============================================
// 3. MESSAGE COMPONENT (Memoized)
// ============================================
const MessageItem = React.memo(({ message }) => {
  const isAI = message.sender === "ai";

  return (
    <div
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
      role="article"
      aria-label={`${isAI ? "AI" : "User"} message`}
    >
      <div
        className={`max-w-[85%] p-3 rounded-2xl ${
          isAI
            ? "bg-dark-700 text-gray-200 rounded-bl-sm"
            : "bg-accent text-dark-900 rounded-br-sm"
        }`}
      >
        {isAI && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-gray-400 font-medium">Assistant</span>
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

// ============================================
// 4. MAIN AI CHAT COMPONENT
// ============================================
const AIChat = ({ isOpen, onClose }) => {
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({
    instrument: "XAUUSD",
    timeframe: "4H",
    tradeCount: 0,
    sentiment: "Neutral",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================
  // 5. PERSIST CHAT HISTORY
  // ============================================
  const CHAT_STORAGE_KEY = "tradex_chat_history";
  const MAX_STORED_MESSAGES = 100;

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return true;
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
      return false;
    };

    const hasHistory = loadChatHistory();

    // Only set welcome message if no history exists
    if (!hasHistory) {
      setMessages([
        {
          id: generateMessageId(),
          sender: "ai",
          text: "👋 Hello! I'm your **TRADEX AI Assistant**. I specialize in ICT concepts, SMT divergence, timeframe alignment, and market analysis. Ask me anything about trading!",
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setIsInitialized(true);
    fetchContext();
  }, []);

  // Save chat history when messages change
  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;

    try {
      // Limit stored messages to prevent localStorage overflow
      const messagesToStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToStore));
    } catch (error) {
      console.error("Failed to save chat history:", error);
      // If localStorage is full, clear it and try again
      if (error.name === "QuotaExceededError") {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        toast.error("Chat history cleared due to storage limits");
      }
    }
  }, [messages, isInitialized]);

  // ============================================
  // 6. SCROLL MANAGEMENT
  // ============================================
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ============================================
  // 7. FETCH CONTEXT
  // ============================================
  const fetchContext = async () => {
    try {
      const [statsRes, sentimentRes] = await Promise.all([
        api.get("/trades/stats"),
        api.get("/sentiment/XAUUSD"),
      ]);

      setContext((prev) => ({
        ...prev,
        tradeCount: statsRes.data?.total || 0,
        sentiment:
          sentimentRes.data?.data?.synthesis?.overallSentiment || "Neutral",
      }));
    } catch (error) {
      console.error("Failed to fetch context:", error);
      // Silent fail - keep existing context
    }
  };

  // ============================================
  // 8. SEND MESSAGE
  // ============================================
  const handleSend = useCallback(
    async (messageText) => {
      const textToSend = messageText || input.trim();
      if (!textToSend) return;

      // Clear input immediately
      setInput("");

      // Create user message
      const userMessage = {
        id: generateMessageId(),
        sender: "user",
        text: textToSend,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await api.post("/ai/chat", {
          message: textToSend,
          context: context,
        });

        const aiMessage = {
          id: generateMessageId(),
          sender: "ai",
          text:
            response.data.response ||
            "I understand your question. Could you provide more details about the setup you're analyzing?",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Chat error:", error);

        // Enhanced error messages
        let errorMessage = "I'm having trouble connecting to the AI service. ";

        if (error.response?.status === 429) {
          errorMessage =
            "Rate limit exceeded. Please wait a moment before sending another message.";
          toast.error("Too many requests. Please wait a moment.");
        } else if (error.response?.status === 400) {
          errorMessage = "Invalid request. Please rephrase your question.";
          toast.error("Invalid request. Please try again.");
        } else if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          errorMessage =
            "Request timeout. The AI is taking too long to respond. Please try again.";
          toast.error("Request timeout. Please try again.");
        } else {
          toast.error("AI service temporarily unavailable");
        }

        // Fallback response with ICT knowledge
        const fallbackResponse =
          `${errorMessage}\n\n` +
          "In ICT trading, always start with higher timeframe bias (Weekly/Daily), " +
          "then work down to 4H for structure and 1H/15min for entries. " +
          "What specific asset or setup are you looking at?";

        const aiMessage = {
          id: generateMessageId(),
          sender: "ai",
          text: fallbackResponse,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } finally {
        setLoading(false);
        // Focus input after sending
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, context],
  );

  // ============================================
  // 9. QUICK SUGGESTIONS (Fixed Race Condition)
  // ============================================
  const handleQuickSuggestion = useCallback(
    (label) => {
      const message = `Explain ${label} to me`;
      handleSend(message);
    },
    [handleSend],
  );

  // ============================================
  // 10. KEYBOARD SHORTCUTS
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to open/close
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent component
          document.dispatchEvent(new CustomEvent("toggleAIChat"));
        }
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }

      // Ctrl/Cmd + / to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "/" && isOpen) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ============================================
  // 11. CLEAR CHAT HISTORY
  // ============================================
  const clearChatHistory = useCallback(() => {
    if (window.confirm("Clear all chat history?")) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      setMessages([
        {
          id: generateMessageId(),
          sender: "ai",
          text: "👋 Chat history cleared! I'm ready to help with your trading questions.",
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.success("Chat history cleared");
    }
  }, []);

  // ============================================
  // 12. QUICK SUGGESTIONS DATA
  // ============================================
  const quickSuggestions = useMemo(
    () => [
      { label: "SMT Divergence", icon: <TrendingUp className="w-3 h-3" /> },
      { label: "Order Block", icon: <Zap className="w-3 h-3" /> },
      { label: "Timeframe Alignment", icon: <Minus className="w-3 h-3" /> },
      { label: "FVG", icon: <TrendingDown className="w-3 h-3" /> },
    ],
    [],
  );

  // ============================================
  // 13. RENDER
  // ============================================
  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div
        className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[650px] bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="AI Chat Assistant"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-gradient-to-r from-dark-900 to-dark-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">TRADEX AI</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-gray-400">
                  ICT Expert • Online
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear History Button */}
            <button
              onClick={clearChatHistory}
              className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Context Bar */}
        <div className="px-4 py-2 bg-dark-900/50 border-b border-dark-700 flex items-center gap-3 text-xs">
          <span className="text-gray-500">Context:</span>
          <span className="text-accent font-medium">{context.instrument}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{context.timeframe}</span>
          <span className="text-gray-600">|</span>
          <span className={getSentimentColor(context.sentiment)}>
            Sentiment: {context.sentiment}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">{context.tradeCount} trades</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30 max-h-[380px]">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark-700 p-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 border-t border-dark-700 bg-dark-900/50">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-dark-600">
            {quickSuggestions.map((item) => (
              <button
                key={item.label}
                onClick={() => handleQuickSuggestion(item.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 text-xs rounded-full transition-colors whitespace-nowrap border border-dark-600 hover:border-accent/50"
                aria-label={`Ask about ${item.label}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-700 bg-dark-900">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about ICT, SMT, or any trading question... (⌘+/ to focus)"
              className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm transition-colors"
              disabled={loading}
              aria-label="Chat input"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-accent text-dark-900 rounded-xl hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-500 text-center flex items-center justify-center gap-2">
            <span>🔒 Private & secure</span>
            <span>•</span>
            <span>⚡ Powered by DeepSeek AI</span>
            <span>•</span>
            <span>📊 ICT optimized</span>
            <span>•</span>
            <kbd className="px-1 py-0.5 bg-dark-700 rounded text-gray-400 text-[9px]">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AIChat;
