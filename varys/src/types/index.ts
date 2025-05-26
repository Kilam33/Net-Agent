export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'thinking' | 'generating' | 'complete' | 'error';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  status?: MessageStatus;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
}

export interface ApiCapabilities {
  streaming: boolean;
  tools: string[];
  model: string;
}

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  debugMode: boolean;
  apiKey: string;
  tools: {
    securityScanner: boolean;
    codeAnalysis: boolean;
    dataOperations: boolean;
    networkMonitor: boolean;
  };
}

export interface SettingsResponse {
  settings: Settings;
  success: boolean;
  message?: string;
}