import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Shield, Terminal, Database, Workflow, Key } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { Settings } from '../../types';

export const SettingsPage: React.FC = () => {
  const { settings, loading, error, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize local settings when context settings load
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value
      };
    });
  };

  const handleToolToggle = (tool: keyof Settings['tools']) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tools: {
          ...prev.tools,
          [tool]: !prev.tools[tool]
        }
      };
    });
  };

  const handleSave = async () => {
    if (!localSettings) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      await updateSettings(localSettings);
    } catch (err) {
      setSaveError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await resetSettings();
    } catch (err) {
      setSaveError('Failed to reset settings');
      console.error('Error resetting settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-skeleton">
        <div className="segment-topbar">
          <div className="segment-topbar__header mb-1">
            <div className="segment-topbar__overline text-overline">System Configuration</div>
            <h1 className="segment-topbar__title text-heading1">Settings</h1>
          </div>
        </div>
        <div className="pad mt-5">
          <div className="pad__body">
            <p className="text-primary-500">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !localSettings) {
    return (
      <div className="app-skeleton">
        <div className="segment-topbar">
          <div className="segment-topbar__header mb-1">
            <div className="segment-topbar__overline text-overline">System Configuration</div>
            <h1 className="segment-topbar__title text-heading1">Settings</h1>
          </div>
        </div>
        <div className="pad mt-5">
          <div className="pad__body">
            <p className="text-red-500">Error: {error || 'Failed to load settings'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-skeleton">
      <div className="segment-topbar">
        <div className="segment-topbar__header mb-1">
          <div className="segment-topbar__overline text-overline">System Configuration</div>
          <h1 className="segment-topbar__title text-heading1">Settings</h1>
        </div>
        <div className="segment-topbar__aside">
        </div>
      </div>

      {saveError && (
        <div className="pad mt-5">
          <div className="pad__body">
            <p className="text-red-500">{saveError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Model Configuration Section */}
        <div className="pad mt-5">
          <div className="pad__body">
            <h2 className="text-heading2 text-secondary-500 mb-4">Model Configuration</h2>
            
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="model">Model</label>
              <div className="form-control">
                <select 
                  id="model"
                  className="w-full bg-transparent border-0 text-primary-500 cyberpunk-select"
                  value={localSettings.model}
                  onChange={(e) => handleSettingChange('model', e.target.value)}
                >
                  <option value="deepseek/deepseek-r1:free">Deepseek-r1</option>
                  <option value="mistralai/devstral-small:free">Devstral-small</option>
                  <option value="google/gemini-pro:free">Gemini Pro</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label" htmlFor="temperature">Temperature: {localSettings.temperature}</label>
              <div className="form-control">
                <input 
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label" htmlFor="maxTokens">Max Tokens</label>
              <div className="form-control">
                <input 
                  type="number"
                  id="maxTokens"
                  value={localSettings.maxTokens}
                  onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label" htmlFor="apiKey">OpenRouter API Key</label>
              <div className="form-control">
                <div className="relative">
                  <input 
                    type="password"
                    id="apiKey"
                    value={localSettings.apiKey}
                    onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                    className="w-full bg-transparent border-0 text-primary-500 pr-10"
                    placeholder="Enter your OpenRouter API key"
                  />
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="streamingEnabled"
                checked={localSettings.streamingEnabled}
                onChange={(e) => handleSettingChange('streamingEnabled', e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="streamingEnabled" className="text-primary-500">Enable streaming responses</label>
            </div>
          </div>
        </div>

        {/* Security & Tools Section */}
        <div className="pad mt-5">
          <div className="pad__body">
            <h2 className="text-heading2 text-secondary-500 mb-4">Security & Tools</h2>
            
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="securityLevel">Security Level</label>
              <div className="form-control">
                <select 
                  id="securityLevel"
                  className="w-full bg-transparent border-0 text-primary-500 cyberpunk-select"
                  value={localSettings.securityLevel}
                  onChange={(e) => handleSettingChange('securityLevel', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-heading3 text-secondary-500">Active Tools</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="pad">
                  <div className="pad__body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-secondary-500" />
                        <span className="text-primary-500">Security Scanner</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={localSettings.tools.securityScanner}
                        onChange={() => handleToolToggle('securityScanner')}
                        className="form-checkbox"
                      />
                    </div>
                  </div>
                </div>

                <div className="pad">
                  <div className="pad__body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Terminal className="w-5 h-5 mr-2 text-secondary-500" />
                        <span className="text-primary-500">Code Analysis</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={localSettings.tools.codeAnalysis}
                        onChange={() => handleToolToggle('codeAnalysis')}
                        className="form-checkbox"
                      />
                    </div>
                  </div>
                </div>

                <div className="pad">
                  <div className="pad__body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Database className="w-5 h-5 mr-2 text-secondary-500" />
                        <span className="text-primary-500">Data Operations</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={localSettings.tools.dataOperations}
                        onChange={() => handleToolToggle('dataOperations')}
                        className="form-checkbox"
                      />
                    </div>
                  </div>
                </div>

                <div className="pad">
                  <div className="pad__body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Workflow className="w-5 h-5 mr-2 text-secondary-500" />
                        <span className="text-primary-500">Network Monitor</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={localSettings.tools.networkMonitor}
                        onChange={() => handleToolToggle('networkMonitor')}
                        className="form-checkbox"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input 
                type="checkbox"
                id="debugMode"
                checked={localSettings.debugMode}
                onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="debugMode" className="text-primary-500">Enable debug mode</label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button 
          className="glowbutton3 glowbutton3--size-l group"
          onClick={handleReset}
          disabled={isSaving}
        >
          <span className="button__content text-primary-500">
            <RefreshCw className="button__icon text-blue-500 group-hover:text-red-500 transition-colors" />
            Reset
          </span>
          <span className="glowbutton3__glitch">
            <span className="button__content text-primary-500">
              <RefreshCw className="button__icon text-blue-500 group-hover:text-red-500 transition-colors" />
              Reset
            </span>
          </span>
        </button>
        <button 
          className="glowbutton3 glowbutton3--size-l group"
          onClick={handleSave}
          disabled={isSaving}
        >
          <span className="button__content text-primary-500">
            <Save className="button__icon text-blue-500 group-hover:text-red-500 transition-colors" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </span>
          <span className="glowbutton3__glitch">
            <span className="button__content text-primary-500">
              <Save className="button__icon text-blue-500 group-hover:text-red-500 transition-colors" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}; 