import React from 'react';

interface MessageProps {
  content: string;
  author: string;
  timestamp: string;
  isUser: boolean;
}

const Message: React.FC<MessageProps> = ({ content, author, timestamp, isUser }) => {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--agent'}`}>
      <div className="message__body">
        <div className="message__content">
          {content}
        </div>
      </div>
      <div className="message__footer">
        <span className="message__authoring">{author}</span>
        <span className="message__time"> - {formattedTime}</span>
      </div>
    </div>
  );
};

export default Message; 