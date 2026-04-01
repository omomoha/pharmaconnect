'use client';

import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '@/lib/services';
import type { ChatMessage } from '@/lib/services/ai.service';

const SUGGESTED_PROMPTS = [
  { icon: '💊', text: 'What can I take for a headache?' },
  { icon: '🤒', text: 'Best OTC cold & flu remedies?' },
  { icon: '⚠️', text: 'Can I take ibuprofen with paracetamol?' },
  { icon: '🔍', text: 'Find pharmacies near me' },
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await aiService.chatWithAssistant(text, messages);
      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (response.data.disclaimers && response.data.disclaimers.length > 0) {
          const disclaimerMessage: ChatMessage = {
            role: 'assistant',
            content: '⚠️ ' + response.data.disclaimers.join('\n'),
          };
          setMessages((prev) => [...prev, disclaimerMessage]);
        }
      } else {
        setError(response.error?.message || 'Failed to get response');
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-40 ${
          isOpen
            ? 'bg-gray-800 hover:bg-gray-900 rotate-0'
            : 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 hover:scale-110 hover:shadow-glow-green'
        }`}
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-200 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <span className="text-sm">🤖</span>
                </div>
                <div>
                  <h2 className="font-semibold text-sm">PharmaConnect AI</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                    <span className="text-[10px] text-green-100">Online</span>
                  </div>
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(null); }}
                className="text-xs text-white/70 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
              >
                Clear
              </button>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50/80 border-b border-amber-100 px-4 py-2">
            <p className="text-[10px] text-amber-700 leading-relaxed">
              <span className="font-semibold">Disclaimer:</span> AI provides general info only.
              Not a substitute for professional medical advice.
            </p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center animate-float">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-700">How can I help you?</p>
                  <p className="text-xs text-gray-400">Ask about medications, symptoms, or health</p>
                </div>
                <div className="w-full space-y-2 mt-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.text)}
                      className="w-full text-left px-3 py-2.5 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-xl transition-all duration-200 text-xs text-gray-700 hover:text-primary-700 flex items-center gap-2.5 group"
                    >
                      <span className="text-sm group-hover:scale-110 transition-transform">{prompt.icon}</span>
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <span className="text-xs">🤖</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <span className="text-xs">🤖</span>
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center animate-fade-in">
                    <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 max-w-xs">
                      <p className="text-xs text-red-600">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="text-[10px] text-red-400 hover:text-red-600 mt-1 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 bg-gray-50/50">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 disabled:opacity-50 transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-xl transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
