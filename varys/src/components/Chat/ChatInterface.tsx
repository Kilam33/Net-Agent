import React, { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '../../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onFileUpload?: (file: File) => void;
  onRegenerate?: (messageId: string) => void;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onFileUpload,
  onRegenerate,
  isLoading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div 
        className="channel-feed__body flex-1 overflow-y-auto p-1 custom-scrollbar" 
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="pad max-w-lg">
              <div className="pad__body">
                <h3 className="text-heading3 text-secondary-500 mb-2">Welcome to Night-City NetWire</h3>
                <p className="text-paragraph1 mb-4">
                  I'm your AI assistant. Ask me anything about programming, data, or general knowledge.
                </p>
                <p className="text-paragraph1">
                  I can help with code examples, explanations, and more. Try asking something like:
                </p>
                <ul className="mt-2 space-y-1">
                  <li className="text-tertiary-500">"Explain how to use async/await in JavaScript"</li>
                  <li className="text-tertiary-500">"Write a Python function to calculate Fibonacci numbers"</li>
                  <li className="text-tertiary-500">"What are the best practices for React components?"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} onRegenerate={onRegenerate} />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="channel-feed__footer sticky bottom-0">
        <MessageInput 
          onSendMessage={onSendMessage} 
          onFileUpload={onFileUpload}
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};