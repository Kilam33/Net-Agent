import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage,
  isLoading
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form 
      className="channel-message-form"
      onSubmit={handleSubmit}
    >
      <div className="form-group w-full">
        <label className="form-label" htmlFor="message">Message</label>
        <div className="form-control">
          <textarea
            ref={textareaRef}
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isLoading}
            rows={1}
            className="min-h-[67px] max-h-[200px]"
          />
        </div>
      </div>
      <div className="form-footer">
        <button 
          className={`glowbutton3 glowbutton3--size-xl ${isLoading ? 'glowbutton3--primary' : ''}`}
          type="submit"
          disabled={isLoading}
        >
          <span className="button__content">
            <Send className="button__icon" />
            {isLoading ? 'Processing...' : 'Send'}
          </span>
          <span className="glowbutton3__glitch">
            <span className="button__content">
              <Send className="button__icon" />
              {isLoading ? 'Processing...' : 'Send'}
            </span>
          </span>
        </button>
      </div>
    </form>
  );
};