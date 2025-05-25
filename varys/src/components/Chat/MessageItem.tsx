import React, { useState, useEffect } from 'react';
import type { Message } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Copy, CheckCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
}

interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [formattedTime, setFormattedTime] = useState(formatRelativeTime(message.timestamp));
  
  useEffect(() => {
    // Update the formatted time immediately
    setFormattedTime(formatRelativeTime(message.timestamp));
    
    // Set up an interval to update the time every minute
    const interval = setInterval(() => {
      setFormattedTime(formatRelativeTime(message.timestamp));
    }, 60000); // 60000 ms = 1 minute
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [message.timestamp]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const isUser = message.role === 'user';
  const isThinking = message.status === 'thinking';
  const isGenerating = message.status === 'generating';
  const isError = message.status === 'error';

  const components: Components = {
    code(props) {
      const { node, inline, className, children, ...rest } = props as CodeComponentProps;
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...(rest as SyntaxHighlighterProps)}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
  };
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'ai-message'} flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="message__body max-w-[80%] flex flex-col">
        <div className="flex-1">
          {isThinking ? (
            <div className="flex items-center space-x-2">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Thinking...</span>
            </div>
          ) : isGenerating ? (
            <div className="markdown-content relative">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={components}
              >
                {message.content}
              </ReactMarkdown>
              <div className="typing-indicator absolute bottom-0 right-0">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={components}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className="message__footer flex items-center justify-between mt-2 pt-2 border-t border-primary-600">
          <div className="flex items-center">
            <span className="message__authoring">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className="mx-2">-</span>
            <span>{formattedTime}</span>
          </div>
          
          {!isUser && !isThinking && !isGenerating && message.content && (
            <div className="flex items-center space-x-2">
              <button 
                className="text-secondary-500 hover:text-secondary-400 transition-colors"
                onClick={copyToClipboard}
                title="Copy message"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
              <button
                className="text-secondary-500 hover:text-secondary-400 transition-colors"
                onClick={onRegenerate}
                title="Regenerate response"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};