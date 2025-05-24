import React, { useState, useEffect } from 'react';

interface MessageProps {
  content: string;
  author: string;
  timestamp: string;
  isUser: boolean;
  isStreaming?: boolean;
}

interface ParsedContent {
  type: 'text' | 'header' | 'code-block' | 'inline-code' | 'list' | 'callout' | 'table';
  content: string;
  level?: number;
  language?: string;
  items?: string[];
  calloutType?: 'info' | 'warning' | 'tip' | 'important' | 'note';
  rows?: string[][];
  headers?: string[];
}

const Message: React.FC<MessageProps> = ({ content, author, timestamp, isUser, isStreaming = false }) => {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullMessage, setShowFullMessage] = useState(false);

  // Update relative timestamp
  useEffect(() => {
    const updateRelativeTime = () => {
      const now = new Date();
      const messageTime = new Date(timestamp);
      const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);

      if (diffInSeconds < 10) {
        setRelativeTime('just now');
      } else if (diffInSeconds < 60) {
        setRelativeTime(`${diffInSeconds}s ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setRelativeTime(`${minutes}m ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setRelativeTime(`${hours}h ago`);
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        setRelativeTime(`${days}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  // Enhanced content parser
  const parseContent = (text: string): ParsedContent[] => {
    const lines = text.split('\n');
    const parsed: ParsedContent[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Headers
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#+/)?.[0].length || 1;
        parsed.push({
          type: 'header',
          content: line.replace(/^#+\s/, ''),
          level
        });
        i++;
      }
      // Code blocks
      else if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        parsed.push({
          type: 'code-block',
          content: codeLines.join('\n'),
          language: language || 'text'
        });
        i++; // Skip closing ```
      }
      // Tables
      else if (line.includes('|') && lines[i + 1]?.includes('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        
        if (tableLines.length >= 2) {
          const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
          const rows = tableLines.slice(2).map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
          );
          
          parsed.push({
            type: 'table',
            content: '',
            headers,
            rows
          });
        }
      }
      // Lists
      else if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) {
        const listItems: string[] = [];
        const isOrdered = line.match(/^[\s]*\d+\.\s/);
        
        while (i < lines.length && (lines[i].match(/^[\s]*[-*+]\s/) || lines[i].match(/^[\s]*\d+\.\s/))) {
          listItems.push(lines[i].replace(/^[\s]*[-*+\d\.]\s/, ''));
          i++;
        }
        
        parsed.push({
          type: 'list',
          content: isOrdered ? 'ordered' : 'unordered',
          items: listItems
        });
      }
      // Callouts
      else if (line.match(/^(Important|Warning|Tip|Note):/i)) {
        const calloutMatch = line.match(/^(Important|Warning|Tip|Note):/i);
        const calloutType = (calloutMatch?.[1]?.toLowerCase() || 'info') as 'info' | 'warning' | 'tip' | 'important' | 'note';
        const calloutContent = line.split(':').slice(1).join(':').trim();
        
        parsed.push({
          type: 'callout',
          content: calloutContent,
          calloutType: calloutType === 'note' ? 'info' : calloutType
        });
        i++;
      }
      // Text with inline formatting
      else {
        // Collect consecutive text lines
        const textLines: string[] = [];
        while (i < lines.length && 
               !lines[i].startsWith('#') && 
               !lines[i].startsWith('```') &&
               !lines[i].match(/^[\s]*[-*+]\s/) &&
               !lines[i].match(/^[\s]*\d+\.\s/) &&
               !lines[i].match(/^(Important|Warning|Tip|Note):/i) &&
               !lines[i].includes('|')) {
          if (lines[i].trim()) textLines.push(lines[i]);
          i++;
        }
        
        if (textLines.length > 0) {
          parsed.push({
            type: 'text',
            content: textLines.join(' ')
          });
        }
      }
    }

    return parsed;
  };

  // Render inline formatting (bold, italic, code)
  const renderInlineFormatting = (text: string) => {
    // Handle inline code first to avoid conflicts
    const parts = text.split(/(`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <span key={index} className="inline-code-wrapper">
            <code className="inline-code">{code}</code>
            <button
              onClick={() => copyToClipboard(code, `inline-${index}`)}
              className="inline-copy-button"
              title="Copy code"
            >
              📋
            </button>
          </span>
        );
      }
      
      // Process bold and italic
      let processed = part;
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
      processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');
      
      return <span key={index} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  // Get syntax highlighting class
  const getSyntaxClass = (language: string) => {
    const langMap: { [key: string]: string } = {
      'javascript': 'language-javascript',
      'js': 'language-javascript',
      'typescript': 'language-typescript',
      'ts': 'language-typescript',
      'python': 'language-python',
      'py': 'language-python',
      'java': 'language-java',
      'cpp': 'language-cpp',
      'c++': 'language-cpp',
      'html': 'language-html',
      'css': 'language-css',
      'json': 'language-json',
      'sql': 'language-sql',
      'bash': 'language-bash',
      'shell': 'language-bash'
    };
    
    return langMap[language.toLowerCase()] || 'language-text';
  };

  // Render parsed content
  const renderParsedContent = (parsedContent: ParsedContent[]) => {
    return parsedContent.map((block, index) => {
      switch (block.type) {
        case 'header':
          const HeaderTag = `h${Math.min(block.level || 1, 6)}` as keyof JSX.IntrinsicElements;
          return (
            <HeaderTag key={index} className={`message-header message-header--${block.level}`}>
              {renderInlineFormatting(block.content)}
            </HeaderTag>
          );

        case 'code-block':
          return (
            <div key={index} className="code-block-wrapper my-3">
              <div className="code-block-header">
                <span className="code-language">{block.language}</span>
                <div className="code-actions">
                  <button
                    onClick={() => copyToClipboard(block.content, `code-${index}`)}
                    className="copy-button"
                    title="Copy code"
                  >
                    {copySuccess[`code-${index}`] ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
              <pre className={`code-block ${getSyntaxClass(block.language || 'text')}`}>
                <code>{block.content}</code>
              </pre>
            </div>
          );

        case 'list':
          const ListTag = block.content === 'ordered' ? 'ol' : 'ul';
          return (
            <ListTag key={index} className="message-list">
              {block.items?.map((item, itemIndex) => (
                <li key={itemIndex} className="message-list-item">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ListTag>
          );

        case 'table':
          return (
            <div key={index} className="table-wrapper">
              <table className="message-table">
                <thead>
                  <tr>
                    {block.headers?.map((header, headerIndex) => (
                      <th key={headerIndex}>{renderInlineFormatting(header)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{renderInlineFormatting(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case 'callout':
          const calloutIcons = {
            info: 'ℹ️',
            warning: '⚠️',
            tip: '💡',
            important: '❗',
            note: 'ℹ️'
          };
          
          const calloutType = block.calloutType || 'info';
          const calloutTitle = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
          
          return (
            <div key={index} className={`callout callout--${calloutType}`}>
              <div className="callout-header">
                <span className="callout-icon">{calloutIcons[calloutType]}</span>
                <span className="callout-title">{calloutTitle}</span>
              </div>
              <div className="callout-content">
                {renderInlineFormatting(block.content)}
              </div>
            </div>
          );

        case 'text':
        default:
          return (
            <p key={index} className="message-paragraph">
              {renderInlineFormatting(block.content)}
            </p>
          );
      }
    });
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(prev => ({ ...prev, [key]: true }));
      
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopySuccess(prev => ({ ...prev, [key]: false }));
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyFullMessage = () => {
    copyToClipboard(content, 'full-message');
  };

  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Determine if message should be collapsible
  const isLongMessage = content.length > 500;
  const shouldShowPreview = isLongMessage && !showFullMessage;
  const previewContent = shouldShowPreview ? content.slice(0, 300) + '...' : content;
  const parsedContent = parseContent(shouldShowPreview ? previewContent : content);

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--agent'} ${isStreaming ? 'message--streaming' : ''}`}>
      <div className="message__body">
        <div className="message__content">
          {isStreaming && content === '' ? (
            <div className="streaming-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="streaming-text">Thinking...</span>
            </div>
          ) : (
            <div className="message-content-wrapper">
              {renderParsedContent(parsedContent)}
              
              {/* Expand/Collapse for long messages */}
              {isLongMessage && (
                <button
                  onClick={() => setShowFullMessage(!showFullMessage)}
                  className="expand-button"
                >
                  {showFullMessage ? '▲ Show less' : '▼ Show more'}
                </button>
              )}
              
              {isStreaming && content !== '' && (
                <span className="streaming-cursor">|</span>
              )}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {!isUser && !isStreaming && content && (
          <div className="message-actions">
            <button
              onClick={copyFullMessage}
              className="action-button"
              title="Copy message"
            >
              {copySuccess['full-message'] ? '✓' : '📋'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="action-button"
              title="Toggle details"
            >
              {isExpanded ? '📄' : '📋'}
            </button>
          </div>
        )}
      </div>

      <div className="message__footer">
        <span className="message__authoring">{author}</span>
        <span className="message__time" title={formattedTime}>
          {relativeTime ? ` - ${relativeTime}` : ` - ${formattedTime}`}
        </span>
        
        {/* Message Status Indicator */}
        {isStreaming && (
          <span className="message__status">
            <span className="status-indicator status-indicator--generating">●</span>
            Generating...
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;