import React from 'react';
import type { Message } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  onRegenerate?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, onRegenerate }) => {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          onRegenerate={message.role === 'assistant' ? () => onRegenerate?.(message.id) : undefined}
        />
      ))}
    </div>
  );
};