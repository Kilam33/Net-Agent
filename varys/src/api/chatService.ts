import type { Message, MessageStatus, Settings, SettingsResponse } from '../types/index.js';

const API_URL = 'http://localhost:8000';

interface ChatResponse {
  response: string;
}

interface FileUploadResponse {
  success: boolean;
  message: string;
  content?: string;
}

interface Capabilities {
  streaming: boolean;
  tools: string[];
  model: string;
}

// Debug API methods
export const getDebugLogs = async (type?: string, token?: string): Promise<{
  logs: any[];
  metrics: any;
}> => {
  try {
    if (!token) {
      throw new Error('Debug token is required');
    }

    console.log('Fetching debug logs with token:', token); // Debug log

    const response = await fetch(`${API_URL}/debug/logs${type ? `?type=${type}` : ''}`, {
      headers: {
        'X-Debug-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Debug logs response error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 401) {
        throw new Error('Invalid or expired debug token');
      }
      throw new Error(`Failed to fetch debug logs: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      logs: data.logs || [],
      metrics: data.metrics || {}
    };
  } catch (error) {
    console.error('Error fetching debug logs:', error);
    throw error;
  }
};

export const clearDebugLogs = async (token?: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    if (!token) {
      throw new Error('Debug token is required');
    }

    const response = await fetch(`${API_URL}/debug/logs`, {
      method: 'DELETE',
      headers: {
        'X-Debug-Token': token
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid or expired debug token');
      }
      throw new Error('Failed to clear debug logs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing debug logs:', error);
    throw error;
  }
};

export const getDebugMetrics = async (token?: string): Promise<{
  metrics: any;
}> => {
  try {
    if (!token) {
      throw new Error('Debug token is required');
    }

    const response = await fetch(`${API_URL}/debug/metrics`, {
      headers: {
        'X-Debug-Token': token
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid or expired debug token');
      }
      throw new Error('Failed to fetch debug metrics');
    }

    const data = await response.json();
    return {
      metrics: data.metrics || {}
    };
  } catch (error) {
    console.error('Error fetching debug metrics:', error);
    throw error;
  }
};

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
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, stream: true }),
      signal,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body available');
      }
      
      const reader = response.body.getReader();
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
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          const chunk = decoder.decode(value);
          processChunk(chunk);
          readChunk();
        }).catch(error => {
          if (error.name === 'AbortError') return;
          console.error('Error reading stream:', error);
          onError?.(error);
        });
      }

      readChunk();
    }).catch(error => {
      if (error.name === 'AbortError') return;
      console.error('Streaming error:', error);
      onError?.(error);
    });
    
    return () => controller.abort();
  },
  
  /**
   * Regenerate the last assistant response (non-streaming)
   */
  regenerateMessage: async (messageId?: string): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_URL}/chat/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
   */
  regenerateMessageStream: (messageId: string | undefined, onChunk: (chunk: string) => void, onComplete: () => void, onError?: (error: Error) => void) => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`${API_URL}/chat/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stream: true }),
      signal,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body available');
      }
      
      const reader = response.body.getReader();
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
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          const chunk = decoder.decode(value);
          processChunk(chunk);
          readChunk();
        }).catch(error => {
          if (error.name === 'AbortError') return;
          console.error('Error reading stream:', error);
          onError?.(error);
        });
      }

      readChunk();
    }).catch(error => {
      if (error.name === 'AbortError') return;
      console.error('Error regenerating message:', error);
      onError?.(error);
    });
    
    return () => controller.abort();
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
  },

  /**
   * Upload a file to the chat API
   */
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Upload a file with streaming response
   */
  uploadFileStream: (
    file: File,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError?: (error: Error) => void
  ) => {
    const controller = new AbortController();
    const signal = controller.signal;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('stream', 'true');

    fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      signal,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body available');
      }
      
      const reader = response.body.getReader();
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
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          const chunk = decoder.decode(value);
          processChunk(chunk);
          readChunk();
        }).catch(error => {
          if (error.name === 'AbortError') return;
          console.error('Error reading stream:', error);
          onError?.(error);
        });
      }

      readChunk();
    }).catch(error => {
      if (error.name === 'AbortError') return;
      console.error('Streaming error:', error);
      onError?.(error);
    });
    
    return () => controller.abort();
  },

  /**
   * Get current settings
   */
  getSettings: async (): Promise<SettingsResponse> => {
    try {
      const response = await fetch(`${API_URL}/settings`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update settings
   */
  updateSettings: async (settings: Settings): Promise<SettingsResponse> => {
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Reset settings to defaults
   */
  resetSettings: async (): Promise<SettingsResponse> => {
    try {
      const response = await fetch(`${API_URL}/settings/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },
}; 