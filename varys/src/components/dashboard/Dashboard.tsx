import React, { useState, useRef, useEffect } from 'react';
import Message from '../Message';
import ChatInput from '../ChatInput';
import { apiService } from '../../services/api';

interface ChatMessage {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  isUser: boolean;
  isStreaming?: boolean;
}

const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi, I'm Varys. How can I assist you today?",
      author: 'Varys',
      timestamp: new Date().toISOString(),
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, isRegeneration = false) => {
    // Store the user message for potential regeneration
    setLastUserMessage(content);

    // Add user message (only if not regenerating)
    if (!isRegeneration) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        author: 'You',
        timestamp: new Date().toISOString(),
        isUser: true,
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    // Add streaming AI message placeholder
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: ChatMessage = {
      id: streamingMessageId,
      content: '',
      author: 'Varys',
      timestamp: new Date().toISOString(),
      isUser: false,
      isStreaming: true,
    };
    setMessages((prev) => [...prev, streamingMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response supports streaming
      const contentType = response.headers.get('content-type');
      if (response.body && (contentType?.includes('text/event-stream') || contentType?.includes('text/stream'))) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let buffer = ''; // Buffer to handle partial lines

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines
          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;
            
            // Handle Server-Sent Events format
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6); // Remove 'data: ' prefix
              
              if (data === '[DONE]') {
                // Mark streaming as complete
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === streamingMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  
                  // Update the streaming message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === streamingMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', data, parseError);
                // Skip malformed JSON lines but continue processing
              }
            }
          }
        }

        // Process any remaining buffer content
        if (buffer.trim()) {
          const trimmedBuffer = buffer.trim();
          if (trimmedBuffer.startsWith('data: ')) {
            const data = trimmedBuffer.slice(6);
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === streamingMessageId
                        ? { ...msg, content: accumulatedContent, isStreaming: false }
                        : msg
                    )
                  );
                }
              } catch (parseError) {
                console.warn('Failed to parse final buffer:', data, parseError);
              }
            }
          }
        }

        // Ensure streaming is marked as complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      } else {
        // Fallback to regular JSON response
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Update the message with final content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageId
              ? { ...msg, content: data.response, isStreaming: false }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      // Remove streaming message and add error message with retry
      setMessages((prev) => prev.filter(msg => msg.id !== streamingMessageId));

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Error: ${error instanceof Error ? error.message : 'An error occurred while processing your message.'}`,
        author: 'System',
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (!lastUserMessage || isLoading) return;

    // Remove the last AI message
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && !prev[lastIndex].isUser) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // Resend the last user message
    handleSendMessage(lastUserMessage, true);
  };

  const handleRetry = (originalMessage: string) => {
    // Remove the error message
    setMessages((prev) => prev.slice(0, -1));
    
    // Resend the original message
    handleSendMessage(originalMessage, true);
  };

  const renderMessageWithActions = (message: ChatMessage, index: number) => {
    const isLastMessage = index === messages.length - 1;
    const isLastAIMessage = !message.isUser && isLastMessage;
    const isErrorMessage = message.author === 'System' && message.content.startsWith('Error:');

    return (
      <div key={message.id}>
        <Message
          content={message.content}
          author={message.author}
          timestamp={message.timestamp}
          isUser={message.isUser}
          isStreaming={message.isStreaming}
        />
        
        {/* Regenerate button for last AI message */}
        {isLastAIMessage && !isLoading && lastUserMessage && !isErrorMessage && (
          <div className="message-actions mt-2">
            <button
              onClick={handleRegenerate}
              className="button button--secondary button--small"
              disabled={isLoading}
            >
              🔄 Regenerate
            </button>
          </div>
        )}
        
        {/* Retry button for error messages */}
        {isErrorMessage && lastUserMessage && (
          <div className="message-actions mt-2">
            <button
              onClick={() => handleRetry(lastUserMessage)}
              className="button button--secondary button--small"
              disabled={isLoading}
            >
              🔄 Retry
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="channel-feed h-full">
      <div className="segment-topbar">
        <div className="segment-topbar__header">
          <span className="segment-topbar__overline">AgentModel: meta-llama/llama-3.3-70b-instruct</span>
          <h4 className="segment-topbar__title">Varys Chat</h4>
        </div>
      </div>

      <div className="channel-feed__body">
        <div className="messages-container p-4 space-y-4">
          {messages.map((message, index) => renderMessageWithActions(message, index))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="channel-feed__footer">
        <div className="channel-message-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <div className="form-control">
              <ChatInput onSendMessage={(msg) => handleSendMessage(msg, false)} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;