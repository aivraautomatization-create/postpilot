"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { clsx } from "clsx";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hi! I'm your AI social media assistant. How can I help you grow your audience today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/generate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response.");
      }
      
      setMessages(prev => [...prev, { role: "model", content: data.content || "I'm sorry, I couldn't generate a response." }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: "model", content: `Error: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-light tracking-tight text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-white" />
          AI Assistant
        </h2>
        <p className="text-white/50">Chat with Gemini Pro to strategize your social media growth.</p>
      </div>

      <div className="flex-1 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-glass-elevated">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={clsx(
                "flex gap-4 max-w-[80%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user" ? "bg-white text-black backdrop-blur-md" : "bg-white/15 "
              )}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={clsx(
                "px-4 py-3 rounded-2xl",
                msg.role === "user" 
                  ? "bg-white text-black backdrop-blur-md rounded-tr-sm" 
                  : "bg-white/5 text-white/90 rounded-tl-sm border border-white/10"
              )}>
                <div className="prose prose-sm prose-invert max-w-none">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 text-white/90 rounded-tl-sm border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-sm text-white/50">Gemini is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01]">
          <form 
            onSubmit={handleSend}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about content strategy, caption ideas, or trends..."
              className="flex-1 bg-white/[0.03] border border-white/[0.08] hover:border-white/30 transition-colors duration-500 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-white text-black backdrop-blur-md shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] px-5 py-3 rounded-xl font-medium hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center font-outfit"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
