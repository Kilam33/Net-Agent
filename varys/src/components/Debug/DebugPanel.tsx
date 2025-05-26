import React from 'react';
import { useDebug } from '../../contexts/DebugContext';
import { useSettings } from '../../contexts/SettingsContext';
import { X, RefreshCw, Trash2 } from 'lucide-react';
import styles from './DebugPanel.module.css';

export const DebugPanel: React.FC = () => {
  const {
    logs,
    metrics,
    isOpen,
    filter,
    loading,
    error,
    togglePanel,
    setFilter,
    clearLogs,
    refreshLogs
  } = useDebug();
  const { settings } = useSettings();

  // Only render if debug mode is enabled
  if (!settings?.debugMode) return null;

  return (
    <div className={`${styles.debugPanel} ${isOpen ? '' : styles.closed}`}>
      <div className={styles.header}>
        <h2 className="text-heading2 text-secondary-500">Debug Panel</h2>
        <div className={styles.controls}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="all">All Logs</option>
            <option value="request">Requests</option>
            <option value="response">Responses</option>
            <option value="error">Errors</option>
            <option value="token_usage">Token Usage</option>
            <option value="system_metrics">System Metrics</option>
          </select>
          <button
            onClick={refreshLogs}
            className={styles.button}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={clearLogs}
            className={styles.button}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={togglePanel}
            className={styles.button}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Requests</span>
          <span className={styles.metricValue}>{metrics.total_requests}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Tokens</span>
          <span className={styles.metricValue}>{metrics.total_tokens}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Errors</span>
          <span className={styles.metricValue}>{metrics.total_errors}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Avg Response Time</span>
          <span className={styles.metricValue}>{metrics.avg_response_time.toFixed(2)}s</span>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.logs}>
        {loading ? (
          <div className={styles.loading}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>No logs available</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`${styles.log} ${log.type === 'error' ? styles.logError : ''}`}
            >
              <div className={styles.logHeader}>
                <span className={styles.logType}>{log.type}</span>
                <span className={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className={styles.logData}>
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 