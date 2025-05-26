import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { getDebugLogs, clearDebugLogs } from '../api/chatService';

export interface DebugLog {
  timestamp: string;
  type: string;
  data: any;
  session_id: string;
}

export interface DebugMetrics {
  total_requests: number;
  total_tokens: number;
  total_errors: number;
  avg_response_time: number;
}

interface DebugContextType {
  logs: DebugLog[];
  metrics: DebugMetrics;
  isOpen: boolean;
  filter: string;
  loading: boolean;
  error: string | null;
  togglePanel: () => void;
  setFilter: (filter: string) => void;
  clearLogs: () => Promise<void>;
  refreshLogs: () => Promise<void>;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [metrics, setMetrics] = useState<DebugMetrics>({
    total_requests: 0,
    total_tokens: 0,
    total_errors: 0,
    avg_response_time: 0
  });
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [lastManualRefresh, setLastManualRefresh] = useState(0);
  const [lastAutoRefresh, setLastAutoRefresh] = useState(0);

  // Load debug logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('debug_logs');
    const savedMetrics = localStorage.getItem('debug_metrics');
    const savedToken = localStorage.getItem('debug_token');
    const savedTokenExpiry = localStorage.getItem('debug_token_expiry');
    
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
    }
    if (savedToken && savedTokenExpiry) {
      setDebugToken(savedToken);
      setTokenExpiry(parseInt(savedTokenExpiry));
    }
  }, []);

  // Save debug logs to localStorage when they change
  useEffect(() => {
    if (settings?.debugMode) {
      localStorage.setItem('debug_logs', JSON.stringify(logs));
      localStorage.setItem('debug_metrics', JSON.stringify(metrics));
    }
  }, [logs, metrics, settings?.debugMode]);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (debugToken && tokenExpiry) {
      localStorage.setItem('debug_token', debugToken);
      localStorage.setItem('debug_token_expiry', tokenExpiry.toString());
    }
  }, [debugToken, tokenExpiry]);

  // Function to get a new debug token
  const getDebugToken = useCallback(async () => {
    try {
      console.log('Requesting new debug token...'); // Debug log
      
      const response = await fetch('http://localhost:8000/debug/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error('Failed to get debug token');
      }

      const data = await response.json();
      console.log('Received new debug token:', data); // Debug log
      
      setDebugToken(data.token);
      setTokenExpiry(Date.now() + (data.expires_in * 1000));
      return data.token;
    } catch (err) {
      console.error('Error getting debug token:', err);
      setError('Failed to get debug token');
      return null;
    }
  }, []);

  // Function to check if token is valid
  const isTokenValid = useCallback(() => {
    const isValid = debugToken && tokenExpiry && Date.now() < tokenExpiry;
    console.log('Token validation:', { 
      hasToken: !!debugToken, 
      hasExpiry: !!tokenExpiry, 
      isValid,
      currentTime: Date.now(),
      expiryTime: tokenExpiry
    }); // Debug log
    return isValid;
  }, [debugToken, tokenExpiry]);

  // Function to ensure we have a valid token
  const ensureValidToken = useCallback(async () => {
    if (!isTokenValid()) {
      console.log('Token invalid or expired, requesting new token...'); // Debug log
      const newToken = await getDebugToken();
      if (!newToken) {
        throw new Error('Failed to obtain debug token');
      }
      return newToken;
    }
    return debugToken;
  }, [isTokenValid, getDebugToken, debugToken]);

  // Get initial token when debug mode is enabled
  useEffect(() => {
    if (settings?.debugMode) {
      console.log('Debug mode enabled, getting initial token...'); // Debug log
      ensureValidToken().catch(err => {
        console.error('Error getting initial debug token:', err);
        setError('Failed to initialize debug mode');
      });
    }
  }, [settings?.debugMode, ensureValidToken]);

  // Clear token when debug mode is disabled
  useEffect(() => {
    if (!settings?.debugMode) {
      console.log('Debug mode disabled, clearing token...'); // Debug log
      setDebugToken(null);
      setTokenExpiry(0);
      localStorage.removeItem('debug_token');
      localStorage.removeItem('debug_token_expiry');
    }
  }, [settings?.debugMode]);

  // Calculate exponential backoff delay
  const getBackoffDelay = useCallback(() => {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }, [retryCount]);

  const refreshLogs = useCallback(async (isManual: boolean = false) => {
    if (!settings?.debugMode) return;

    // Check if enough time has passed since last refresh
    const now = Date.now();
    if (isManual) {
      // For manual refreshes, only check if it's been at least 5 seconds
      if (now - lastManualRefresh < 5000) { // 5 second cooldown for manual refreshes
        return;
      }
    } else {
      // For automatic refreshes, check the 10-minute interval
      if (now - lastAutoRefresh < 600000) { // 10 minutes between auto refreshes
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure we have a valid token
      const token = await ensureValidToken();
      if (!token) {
        throw new Error('No valid debug token available');
      }

      const response = await getDebugLogs(filter !== 'all' ? filter : undefined, token);
      if (response.logs && response.metrics) {
        setLogs(response.logs);
        setMetrics(response.metrics);
        setRetryCount(0); // Reset retry count on success
        
        // Update the appropriate refresh timestamp
        if (isManual) {
          setLastManualRefresh(now);
        } else {
          setLastAutoRefresh(now);
        }
      } else {
        throw new Error('Invalid response format from debug logs');
      }
    } catch (err) {
      console.error('Error refreshing debug logs:', err);
      setError('Failed to refresh debug logs');
      setRetryCount(prev => prev + 1);
      
      // Schedule retry with exponential backoff
      const delay = getBackoffDelay();
      setTimeout(() => refreshLogs(isManual), delay);
    } finally {
      setLoading(false);
    }
  }, [settings?.debugMode, filter, ensureValidToken, lastManualRefresh, lastAutoRefresh, getBackoffDelay]);

  const clearLogs = useCallback(async () => {
    if (!settings?.debugMode) return;

    try {
      setLoading(true);
      setError(null);

      // Ensure we have a valid token
      const token = await ensureValidToken();
      if (!token) {
        throw new Error('No valid debug token available');
      }

      const response = await clearDebugLogs(token);
      if (response.success) {
        setLogs([]);
        setMetrics({
          total_requests: 0,
          total_tokens: 0,
          total_errors: 0,
          avg_response_time: 0
        });
      } else {
        throw new Error(response.message || 'Failed to clear debug logs');
      }
    } catch (err) {
      console.error('Error clearing debug logs:', err);
      setError('Failed to clear debug logs');
    } finally {
      setLoading(false);
    }
  }, [settings?.debugMode, ensureValidToken]);

  // Refresh logs periodically when debug mode is enabled
  useEffect(() => {
    if (!settings?.debugMode) return;

    const refreshInterval = setInterval(() => refreshLogs(false), 600000); // Auto refresh every 10 minutes
    return () => clearInterval(refreshInterval);
  }, [settings?.debugMode, refreshLogs]);

  const handleManualRefresh = useCallback(async () => {
    await refreshLogs(true);
  }, [refreshLogs]);

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <DebugContext.Provider
      value={{
        logs,
        metrics,
        isOpen,
        filter,
        loading,
        error,
        togglePanel,
        setFilter,
        clearLogs,
        refreshLogs: handleManualRefresh
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}; 