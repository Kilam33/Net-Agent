import type { Message, MessageStatus } from '../types/index.js';

const API_URL = 'http://localhost:8000';

interface ChatResponse {
  response: string;
}

interface Capabilities {
  streaming: boolean;
  tools: string[];
  model: string;
}

export const chatService = {
  /**
   * Send a message to the chat API
   */
  sendMessage: async (message: string): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  /**
   * Send a message to the chat API with streaming response
   */
  sendMessageStream: (message: string, onChunk: (chunk: string) => void, onComplete: () => void, onError?: (error: Error) => void) => {
    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, stream: true }),
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      function processChunk(chunk: string) {
        buffer += chunk;
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              } else if (parsed.error) {
                onError?.(new Error(parsed.error));
                return;
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
              onError?.(error as Error);
            }
          }
        }
      }

      function readChunk() {
        if (!reader) return;
        
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          const chunk = decoder.decode(value);
          processChunk(chunk);
          readChunk();
        }).catch(error => {
          console.error('Error reading stream:', error);
          onError?.(error);
        });
      }

      readChunk();
    }).catch(error => {
      console.error('Streaming error:', error);
      onError?.(error);
    });
    
    return () => {
      // Cleanup function - could be used to abort the request if needed
    };
  },
  
  /**
   * Regenerate the last assistant response (non-streaming)
   * Note: messageId parameter is kept for API compatibility but not used by backend
   */
  regenerateMessage: async (messageId?: string): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_URL}/chat/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body since backend doesn't use messageId
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error regenerating message:', error);
      throw error;
    }
  },

  /**
   * Regenerate the last assistant response with streaming
   * Note: messageId parameter is kept for API compatibility but not used by backend
   */
  regenerateMessageStream: (messageId: string | undefined, onChunk: (chunk: string) => void, onComplete: () => void, onError?: (error: Error) => void) => {
    fetch(`${API_URL}/chat/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stream: true }), // Only send stream flag, no messageId needed
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      function processChunk(chunk: string) {
        buffer += chunk;
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              } else if (parsed.error) {
                onError?.(new Error(parsed.error));
                return;
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
              onError?.(error as Error);
            }
          }
        }
      }

      function readChunk() {
        if (!reader) return;
        
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          const chunk = decoder.decode(value);
          processChunk(chunk);
          readChunk();
        }).catch(error => {
          console.error('Error reading stream:', error);
          onError?.(error);
        });
      }

      readChunk();
    }).catch(error => {
      console.error('Error regenerating message:', error);
      onError?.(error);
    });
    
    return () => {
      // Cleanup function
    };
  },
  
  /**
   * Get API capabilities
   */
  getCapabilities: async (): Promise<Capabilities> => {
    try {
      const response = await fetch(`${API_URL}/capabilities`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      throw error;
    }
  }
};