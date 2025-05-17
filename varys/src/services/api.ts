// Types for our chat messages and responses
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  error?: string;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API service class
export class ApiService {
  private static instance: ApiService;
  
  private constructor() {}
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Send a message to the AI agent
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        response: '',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
}

// Export a singleton instance
export const apiService = ApiService.getInstance(); 