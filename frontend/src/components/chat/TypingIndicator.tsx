'use client';

import React from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName: string;
}

export default function TypingIndicator({
  isTyping,
  userName,
}: TypingIndicatorProps) {
  if (!isTyping) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-2 px-4">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-sm text-gray-600">
        <span className="font-medium">{userName}</span> is typing...
      </p>
    </div>
  );
}
