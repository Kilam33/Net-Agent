import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload?: (file: File) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage,
  onFileUpload,
  isLoading
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFile) && !isLoading) {
      if (selectedFile && onFileUpload) {
        onFileUpload(selectedFile);
      }
      if (message.trim()) {
        onSendMessage(message);
      }
      setMessage('');
      setSelectedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
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
        <div className="form-control relative">
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
            className="min-h-[17px] max-h-[200px] pr-12"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.pdf,.doc,.docx,.md"
          />
          <button
            type="button"
            onClick={handleFileClick}
            className="absolute right-2 bottom-2 p-2 text-secondary-500 hover:text-secondary-400 transition-colors"
            disabled={isLoading}
          >
            <Upload size={20} />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-secondary-500">
            Selected file: {selectedFile.name}
          </div>
        )}
      </div>
      <div className="form-footer">
        <button 
          className={`glowbutton3 glowbutton3--size-l ${isLoading ? 'glowbutton3--primary' : ''}`}
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