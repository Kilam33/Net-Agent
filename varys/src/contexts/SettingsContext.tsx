import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Settings } from '../types';
import { chatService } from '../api/chatService';

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Settings) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  model: 'deepseek/deepseek-r1:free',
  temperature: 0.7,
  maxTokens: 1000,
  streamingEnabled: true,
  securityLevel: 'high',
  debugMode: false,
  apiKey: '',
  tools: {
    securityScanner: true,
    codeAnalysis: true,
    dataOperations: true,
    networkMonitor: false
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get settings from API first
        const response = await chatService.getSettings();
        if (response.success) {
          setSettings(response.settings);
          localStorage.setItem('settings', JSON.stringify(response.settings));
        } else {
          // Fallback to localStorage if API fails
          const savedSettings = localStorage.getItem('settings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          } else {
            setSettings(defaultSettings);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          setSettings(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatService.updateSettings(newSettings);
      if (response.success) {
        setSettings(newSettings);
        localStorage.setItem('settings', JSON.stringify(newSettings));
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatService.resetSettings();
      if (response.success) {
        setSettings(defaultSettings);
        localStorage.setItem('settings', JSON.stringify(defaultSettings));
      } else {
        throw new Error(response.message || 'Failed to reset settings');
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 