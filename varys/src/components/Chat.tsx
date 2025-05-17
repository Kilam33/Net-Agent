import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import ChatInput from './ChatInput';
import { apiService } from '../services/api';
import type { Message as ApiMessage } from '../services/api';

interface ChatMessage {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  isUser: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Welcome to Varys Net-Agent. How can I assist you today?',
      author: 'Varys',
      timestamp: new Date().toISOString(),
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      author: 'You',
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: 'Processing...',
      author: 'Varys',
      timestamp: new Date().toISOString(),
      isUser: false,
    };
    setMessages((prev) => [...prev, loadingMessage]);
    setIsLoading(true);

    try {
      // Send message to API
      const response = await apiService.sendMessage(content);

      // Remove loading message
      setMessages((prev) => prev.filter(msg => msg.id !== loadingMessage.id));

      if (response.error) {
        // Add error message
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `Error: ${response.error}`,
          author: 'Varys',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // Add AI response
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          content: response.response,
          author: 'Varys',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      // Remove loading message
      setMessages((prev) => prev.filter(msg => msg.id !== loadingMessage.id));

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'An error occurred while processing your message.',
        author: 'Varys',
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="channel-feed flex flex-col h-full">
      <div className="segment-topbar">
        <div className="segment-topbar__header">
          <div className="segment-topbar__overline">
            <span className="segment-topbar__overline-label">AGENTMODEL</span>
            <span className="segment-topbar__overline-model">meta-llama/llama-3.3-70b-instruct</span>
          </div>
          <h4 className="segment-topbar__title text-xl tracking-wider text-shadow-glow-dimmed uppercase">
            Varys Chat
          </h4>
        </div>
      </div>

      <div className="channel-feed__body flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message
            key={message.id}
            content={message.content}
            author={message.author}
            timestamp={message.timestamp}
            isUser={message.isUser}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="channel-feed__footer p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default Chat; 