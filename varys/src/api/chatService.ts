import type { Message, MessageStatus } from '../types/index.js';

const API_URL = 'http://localhost:8000';

export const chatService = {
  /**
   * Send a message to the chat API
   */
  sendMessage: async (message: string): Promise<{ response: string }> => {
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
  sendMessageStream: (message: string, onChunk: (chunk: string) => void, onComplete: () => void) => {
    const eventSource = new EventSource(`${API_URL}/chat?message=${encodeURIComponent(message)}&stream=true`);
    
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
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
            }
          }
        }
      }

      function readChunk() {
        (reader as ReadableStreamDefaultReader<Uint8Array>).read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          const chunk = decoder.decode(value);
          processChunk(chunk);
          readChunk();
        }).catch(error => {
          console.error('Error reading stream:', error);
          onComplete();
        });
      }

      readChunk();
    }).catch(error => {
      console.error('EventSource error:', error);
      onComplete();
    });
    
    return () => {
      // Cleanup function
    };
  },
  
  /**
   * Get API capabilities
   */
  getCapabilities: async (): Promise<{
    streaming: boolean;
    tools: string[];
    model: string;
  }> => {
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