import React, { useState } from 'react';
import type { Message } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Copy, CheckCircle } from 'lucide-react';
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
}

interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  
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
    <div className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className={`message__body ${isUser ? 'border-tertiary-500' : 'border-primary-500'}`}>
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
      <div className="message__footer">
        <span className="message__authoring">
          {isUser ? 'You' : 'AI Assistant'}
        </span>
        {' - '}{formatRelativeTime(message.timestamp)}
        
        {!isUser && !isThinking && !isGenerating && message.content && (
          <button 
            className="ml-2 text-secondary-500 hover:text-secondary-400 transition-colors"
            onClick={copyToClipboard}
            title="Copy message"
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};