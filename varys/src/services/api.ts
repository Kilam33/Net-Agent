// Types for our chat messages and responses
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  error?: string;
}

export interface StreamingChatRequest {
  message: string;
  stream?: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
  stream?: boolean;
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
  async sendMessage(message: string, options?: RequestOptions): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          stream: options?.stream || false 
        } as StreamingChatRequest),
        signal: options?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          response: '',
          error: 'Request timed out'
        };
      }
      console.error('Error sending message:', error);
      return {
        response: '',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  // Send a message with streaming support
  async sendMessageStream(
    message: string, 
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: string) => void,
    options?: RequestOptions
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, stream: true } as StreamingChatRequest),
        signal: options?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if streaming is supported
      const contentType = response.headers.get('content-type');
      if (response.body && (contentType?.includes('text/stream') || contentType?.includes('text/event-stream'))) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              // Handle Server-Sent Events format
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  if (onComplete) onComplete(fullResponse);
                  return { response: fullResponse };
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullResponse += parsed.content;
                    if (onChunk) onChunk(parsed.content);
                  } else if (parsed.delta?.content) {
                    // Support for different streaming formats
                    fullResponse += parsed.delta.content;
                    if (onChunk) onChunk(parsed.delta.content);
                  }
                } catch (parseError) {
                  // Skip malformed JSON lines
                  console.warn('Failed to parse streaming chunk:', data);
                }
              } else {
                // Handle plain text streaming
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.content) {
                    fullResponse += parsed.content;
                    if (onChunk) onChunk(parsed.content);
                  }
                } catch (parseError) {
                  // Treat as plain text chunk
                  fullResponse += line;
                  if (onChunk) onChunk(line);
                }
              }
            }
          }

          if (onComplete) onComplete(fullResponse);
          return { response: fullResponse };
        } catch (streamError) {
          if (streamError instanceof Error && streamError.name === 'AbortError') {
            const errorMessage = 'Stream request timed out';
            if (onError) onError(errorMessage);
            return { response: '', error: errorMessage };
          }
          const errorMessage = streamError instanceof Error ? streamError.message : 'Streaming error occurred';
          if (onError) onError(errorMessage);
          throw streamError;
        }
      } else {
        // Fallback to regular JSON response
        const data = await response.json();
        if (data.error) {
          if (onError) onError(data.error);
          return { response: '', error: data.error };
        }
        
        if (onComplete) onComplete(data.response);
        return data;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const errorMessage = 'Request timed out';
        if (onError) onError(errorMessage);
        return { response: '', error: errorMessage };
      }
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error sending message:', error);
      if (onError) onError(errorMessage);
      return {
        response: '',
        error: errorMessage
      };
    }
  }

  // Check if the API endpoint supports streaming
  async checkStreamingSupport(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/capabilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.streaming === true;
      }
      
      return false;
    } catch (error) {
      console.warn('Could not check streaming capabilities:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const apiService = ApiService.getInstance();