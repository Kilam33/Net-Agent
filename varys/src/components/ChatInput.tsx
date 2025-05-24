import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Height constraints
  const MIN_HEIGHT = 40; // Minimum height in pixels
  const MAX_HEIGHT = 200; // Maximum height in pixels

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the actual scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height within constraints
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
      
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Add scrollbar if content exceeds max height
      textareaRef.current.style.overflowY = scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = `${MIN_HEIGHT}px`;
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getPlaceholderText = () => {
    if (disabled) {
      return 'Please wait...';
    }
    if (isFocused) {
      return 'Type your message... (Shift+Enter for new line)';
    }
    return 'Type your message...';
  };

  return (
    <form className="channel-message-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="form-control form-control--with-addon">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={getPlaceholderText()}
            rows={1}
            className="resize-none"
            disabled={disabled}
            style={{
              minHeight: `${MIN_HEIGHT}px`,
              maxHeight: `${MAX_HEIGHT}px`,
            }}
          />
          <div className="form-control__addon">
            <button
              type="submit"
              className="button button--primary"
              disabled={!message.trim() || disabled}
              title={message.trim() ? 'Send message (Enter)' : 'Type a message to send'}
            >
              {disabled ? '...' : 'Send'}
            </button>
          </div>
        </div>
        {isFocused && (
          <div className="form-hint">
            <small className="text-muted">
              Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
            </small>
          </div>
        )}
      </div>
    </form>
  );
};

export default ChatInput;