import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, Send } from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  content: string;
  status: "sending" | "sent" | "error";
}

interface ApiResponse {
  status: {
    code: number;
    message: string;
    debug_info?: {
      session_stored?: boolean;
      active_sessions?: string[];
    };
  };
  data: any;
}

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const symbol = params.get("symbol");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const cleanupSession = useCallback(async (sid: string) => {
    try {
      console.log("Cleaning up session:", sid);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cleanup_session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sid }),
        }
      );
      const data = await response.json();
      console.log("Cleanup response:", data);
    } catch (error) {
      console.error("Error cleaning up session:", error);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sessionId) {
        cleanupSession(sessionId);
      }
    };
  }, [sessionId, cleanupSession]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!symbol) {
        setError("No stock symbol provided");
        setIsInitializing(false);
        return;
      }

      const newSessionId = `session_${uuidv4()}`;
      console.log("Initializing chat with session:", newSessionId);
      setSessionId(newSessionId);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/get_ticker_data?session_id=${newSessionId}&tickers=${symbol}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        
        const data: ApiResponse = await response.json();
        console.log("Get ticker data response:", data);

        if (data.status.code !== 200 || !data.data) {
          throw new Error(data.status.message || "Failed to fetch stock data");
        }

        if (data.status.debug_info) {
          console.log("Debug info:", data.status.debug_info);
        }

        const initialMessage: Message = {
          id: uuidv4(),
          sender: "bot",
          content: `Hello! I've gathered the latest information about ${symbol}. How can I help you analyze it?`,
          status: "sent",
        };

        setMessages([initialMessage]);
        setError(null);
        inputRef.current?.focus();
      } catch (error) {
        console.error("Error initializing chat:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to initialize chat";
        setError(errorMessage);
        setMessages([
          {
            id: uuidv4(),
            sender: "bot",
            content: `Error: ${errorMessage}`,
            status: "error",
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [symbol]);

  const handleSend = async () => {
    if (input.trim() === "" || !sessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      sender: "user",
      content: input.trim(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsWaiting(true);

    try {
      console.log("Sending chat request:", {
        session_id: sessionId,
        message: userMessage.content,
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SECRET_KEY}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: [userMessage.content],
        }),
      });

      const data: ApiResponse = await response.json();
      console.log("Chat response:", data);

      const botMessage: Message = {
        id: uuidv4(),
        sender: "bot",
        content:
          data.status.code === 200
            ? data.data.response
            : "Sorry, I encountered an error. Please try again.",
        status: data.status.code === 200 ? "sent" : "error",
      };

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((m) =>
          m.id === userMessage.id ? { ...m, status: "sent" as "sent" } : m
        );
        return [...updatedMessages, botMessage];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          sender: "bot",
          content:
            "Sorry, there was an error connecting to the service. Please try again.",
          status: "error",
        },
      ]);
    } finally {
      setIsWaiting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBackToHome = async () => {
    if (sessionId) {
      await cleanupSession(sessionId);
    }
    navigate("/");
  };

  const isLatex = (content: string) => {
    return /\$.*\$.*/.test(content);
  };

  const renderMessageContent = (content: string) => {
    if (isLatex(content)) {
      return <BlockMath math={content} />;
    } else {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
  };


  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToHome}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </div>
          
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-none">
            {symbol}
          </h2>

          {isInitializing && (
            <div className="text-xs sm:text-sm text-gray-500 absolute right-3 sm:static">
              Initializing...
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-16 left-0 right-0 z-20 bg-red-50 border-b border-red-200">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto bg-gray-50 ${error ? "pt-[84px]" : "pt-[60px]"} sm:pt-[76px] pb-[80px] sm:pb-[88px]`}>
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-2xl p-3 sm:p-4 rounded-2xl shadow-sm transition-all duration-200
                    ${message.sender === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white text-gray-800 rounded-bl-none"
                    }
                    ${message.status === "sending" ? "opacity-70" : "opacity-100"}
                    ${message.status === "error" ? "bg-red-50 border border-red-100" : ""}`}
                >
                  <div className={`whitespace-pre-wrap prose prose-sm sm:prose lg:prose-lg
                    ${message.sender === "user" ? "prose-invert" : ""}`}
                  >
                    {renderMessageContent(message.content)}
                  </div>
                  {message.status === "sending" && (
                    <div className="text-xs opacity-70 mt-1">Sending...</div>
                  )}
                </div>
              </div>
            ))}
            {isWaiting && (
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-2xl p-3 sm:p-4 bg-white rounded-2xl rounded-bl-none shadow-sm animate-pulse">
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Fixed Input Container */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-3 sm:p-4 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isWaiting || isInitializing || !!error}
            />
            <button
              onClick={handleSend}
              disabled={isWaiting || isInitializing || !input.trim() || !!error}
              className={`inline-flex items-center justify-center min-w-[44px] h-[44px] sm:min-w-[96px] sm:h-[52px] rounded-xl font-semibold transition-all duration-200
                ${isWaiting || isInitializing || !input.trim() || !!error
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                }`}
            >
              <Send className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline px-4">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;