import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
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
  isStreaming?: boolean;
}

const MAX_MESSAGES = 100;
const MESSAGE_HEIGHT = 150; // Approximate height of a message in pixels
const REQUEST_TIMEOUT = 30000; // 30 seconds

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hi, I am Varys, an AI agent. How can I assist you today?',
      author: 'Varys',
      timestamp: new Date().toISOString(),
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up old messages
  useEffect(() => {
    if (messages.length > MAX_MESSAGES) {
      setMessages(prev => prev.slice(-MAX_MESSAGES));
    }
  }, [messages]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup function for aborting requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      author: 'You',
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: 'Processing...',
      author: 'Varys',
      timestamp: new Date().toISOString(),
      isUser: false,
      isStreaming: true
    };
    setMessages(prev => [...prev, loadingMessage]);
    setIsLoading(true);

    try {
      // Send message to API with timeout
      const response = await apiService.sendMessage(content, {
        signal: abortControllerRef.current.signal,
        stream: true
      });

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

      if (response.error) {
        // Add error message
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `Error: ${response.error}`,
          author: 'Varys',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        // Add AI response
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          content: response.response,
          author: 'Varys',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: error instanceof Error ? error.message : 'An error occurred while processing your message.',
        author: 'Varys',
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const renderMessage = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    return (
      <div style={style}>
        <Message
          key={message.id}
          content={message.content}
          author={message.author}
          timestamp={message.timestamp}
          isUser={message.isUser}
          isStreaming={message.isStreaming}
        />
      </div>
    );
  }, [messages]);

  return (
    <div className="channel-feed flex flex-col h-full" ref={containerRef}>
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

      <div className="channel-feed__body flex-grow overflow-hidden">
        <List
          ref={listRef}
          height={containerRef.current?.clientHeight || 600}
          itemCount={messages.length}
          itemSize={MESSAGE_HEIGHT}
          width="100%"
        >
          {renderMessage}
        </List>
      </div>

      <div className="channel-feed__footer p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default Chat; 