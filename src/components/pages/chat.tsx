import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

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
  };
  data: any;
}

const ChatPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const symbol = params.get("symbol");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!symbol) return;

      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/get_ticker_data?session_id=${newSessionId}&tickers=${symbol}`
        );
        const data: ApiResponse = await response.json();

        const initialMessage: Message = {
          id: Date.now().toString(),
          sender: "bot",
          content: data.status.code === 200
            ? `Hello! I've gathered the latest information about ${symbol}. How can I help you analyze it?`
            : `Sorry, I couldn't fetch data for ${symbol}. Please try again later.`,
          status: data.status.code === 200 ? "sent" : "error"
        };

        setMessages([initialMessage]);
        inputRef.current?.focus();
      } catch (error) {
        setMessages([{
          id: Date.now().toString(),
          sender: "bot",
          content: "Sorry, there was an error connecting to the service. Please try again later.",
          status: "error"
        }]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [symbol]);

  const handleSend = async () => {
    if (input.trim() === "" || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: input.trim(),
      status: "sending"
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsWaiting(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${import.meta.env.VITE_SECRET_KEY}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: [userMessage.content],
        }),
      });

      const data: ApiResponse = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        content: data.status.code === 200 
          ? data.data.response 
          : "Sorry, I encountered an error. Please try again.",
        status: data.status.code === 200 ? "sent" : "error"
      };

      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(m => 
          m.id === userMessage.id ? { ...m, status: "sent" as "sent" } : m
        );
        return [...updatedMessages, botMessage];
      });
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          content: "Sorry, there was an error connecting to the service. Please try again.",
          status: "error"
        }
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

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Stock Analysis - {symbol}
          </h2>
          {isInitializing && (
            <div className="text-sm text-gray-500">
              Initializing chat...
            </div>
          )}
        </div>
      </div>

      {/* Messages Container - Adjust top padding to account for fixed navbar */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pt-[76px]"> {/* Adjust this value based on your navbar height */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl p-4 rounded-2xl shadow-sm transition-all duration-200
                    ${message.sender === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white text-gray-800 rounded-bl-none"
                    }
                    ${message.status === "sending" ? "opacity-70" : "opacity-100"}
                    ${message.status === "error" ? "bg-red-50 border border-red-100" : ""}
                  `}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.status === "sending" && (
                    <div className="text-xs opacity-70 mt-1">Sending...</div>
                  )}
                </div>
              </div>
            ))}
            {isWaiting && (
              <div className="flex justify-start">
                <div className="max-w-2xl p-4 bg-white rounded-2xl rounded-bl-none shadow-sm animate-pulse">
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Container - Fixed at bottom */}
      <div className="flex-none bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isWaiting || isInitializing}
            />
            <button
              onClick={handleSend}
              disabled={isWaiting || isInitializing || !input.trim()}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200
                ${isWaiting || isInitializing || !input.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;