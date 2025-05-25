import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from '../Chat/ChatInterface';
import type { Message, MessageRole, MessageStatus } from '../../types/index.ts';
import { v4 as uuidv4 } from 'uuid';
import { chatService } from '../../api/chatService';

export const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<{
    streaming: boolean;
    tools: string[];
    model: string;
  } | null>(null);

  // Load capabilities on mount
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const caps = await chatService.getCapabilities();
        setCapabilities(caps);
      } catch (error) {
        console.error('Failed to load capabilities', error);
      }
    };
    
    loadCapabilities();
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
      status: 'complete'
    };
    
    // Add AI message placeholder with loading status
    const aiMessage: Message = {
      id: uuidv4(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      status: 'thinking'
    };
    
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsLoading(true);
    
    try {
      if (capabilities?.streaming) {
        // Use streaming for real-time updates
        let responseText = '';
        
        // Update status to generating
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id ? { ...msg, status: 'generating' as MessageStatus } : msg
        ));
        
        chatService.sendMessageStream(
          content,
          (chunk) => {
            responseText += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, content: responseText } : msg
            ));
          },
          () => {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, status: 'complete' as MessageStatus } : msg
            ));
            setIsLoading(false);
          }
        );
      } else {
        // Use regular request
        const response = await chatService.sendMessage(content);
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: response.response, status: 'complete' as MessageStatus } 
            : msg
        ));
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the AI message to show the error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { 
              ...msg, 
              content: 'Sorry, there was an error processing your request.', 
              status: 'error' as MessageStatus 
            } 
          : msg
      ));
      
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    // Find the message to regenerate
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Find the user message that triggered this response
    const userMessageIndex = messages.findIndex((msg, index) => 
      index < messageIndex && msg.role === 'user'
    );
    if (userMessageIndex === -1) return;

    const userMessage = messages[userMessageIndex];
    
    // Update the AI message status to thinking
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'thinking' as MessageStatus } : msg
    ));
    
    setIsLoading(true);
    
    try {
      if (capabilities?.streaming) {
        // Use streaming for real-time updates
        let responseText = '';
        
        // Update status to generating
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'generating' as MessageStatus } : msg
        ));
        
        chatService.regenerateMessageStream(
          messageId,
          (chunk) => {
            responseText += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === messageId ? { ...msg, content: responseText } : msg
            ));
          },
          () => {
            setMessages(prev => prev.map(msg => 
              msg.id === messageId ? { ...msg, status: 'complete' as MessageStatus } : msg
            ));
            setIsLoading(false);
          }
        );
      } else {
        // Use regular request
        const response = await chatService.regenerateMessage(messageId);
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: response.response, status: 'complete' as MessageStatus } 
            : msg
        ));
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error regenerating message:', error);
      
      // Update the AI message to show the error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: 'Sorry, there was an error regenerating the response.', 
              status: 'error' as MessageStatus 
            } 
          : msg
      ));
      
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Add user message about file upload
    const userMessage: Message = {
      id: uuidv4(),
      content: `Uploading file: ${file.name}`,
      role: 'user',
      timestamp: new Date(),
      status: 'complete'
    };
    
    // Add AI message placeholder
    const aiMessage: Message = {
      id: uuidv4(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      status: 'thinking'
    };
    
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsLoading(true);
    
    try {
      if (capabilities?.streaming) {
        let responseText = '';
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id ? { ...msg, status: 'generating' as MessageStatus } : msg
        ));
        
        chatService.uploadFileStream(
          file,
          (chunk) => {
            responseText += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, content: responseText } : msg
            ));
          },
          () => {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, status: 'complete' as MessageStatus } : msg
            ));
            setIsLoading(false);
          }
        );
      } else {
        const response = await chatService.uploadFile(file);
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: response.message, status: 'complete' as MessageStatus } 
            : msg
        ));
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { 
              ...msg, 
              content: 'Sorry, there was an error processing your file.', 
              status: 'error' as MessageStatus 
            } 
          : msg
      ));
      
      setIsLoading(false);
    }
  };

  return (
    <div className="channel-feed h-full flex flex-col overflow-hidden">
      <div className="segment-topbar flex-shrink-0">
        <div className="segment-topbar__header">
          <span className="segment-topbar__overline text-primary-500 font-bold ">AI Assistant: Varys v2.1</span>
        </div>
        <div className="segment-topbar__aside">
          <div className="button-toolbar">
            {capabilities && (
              <div className="text-l text-secondary-500 mr-4">
                Model: {capabilities.model.split('/').pop()?.replace(':free', '')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          onRegenerate={handleRegenerate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};