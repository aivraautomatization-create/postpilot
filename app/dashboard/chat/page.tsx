"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
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
  const chatRef = useRef<any>(null);

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
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      if (!chatRef.current) {
        chatRef.current = ai.chats.create({
          model: "gemini-3.1-pro-preview",
          config: {
            systemInstruction: "You are an expert social media strategist and assistant. Help the user plan content, write captions, analyze trends, and grow their audience. Be concise, actionable, and encouraging.",
          }
        });
      }
      
      const response = await chatRef.current.sendMessage({ message: userMessage });
      
      setMessages(prev => [...prev, { role: "model", content: response.text || "I'm sorry, I couldn't generate a response." }]);
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
          <Sparkles className="w-6 h-6 text-emerald-400" />
          AI Assistant
        </h2>
        <p className="text-white/50">Chat with Gemini Pro to strategize your social media growth.</p>
      </div>

      <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
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
                msg.role === "user" ? "bg-white text-black" : "bg-emerald-400/20 text-emerald-400"
              )}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={clsx(
                "px-4 py-3 rounded-2xl",
                msg.role === "user" 
                  ? "bg-white text-black rounded-tr-sm" 
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
              <div className="w-8 h-8 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 text-white/90 rounded-tl-sm border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-sm text-white/50">Gemini is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <form 
            onSubmit={handleSend}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about content strategy, caption ideas, or trends..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-emerald-400 text-black px-4 py-3 rounded-xl font-medium hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
