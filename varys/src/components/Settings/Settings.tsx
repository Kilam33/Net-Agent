import React, { useState } from 'react';
import { Save, RefreshCw, Shield, Terminal, Database, Workflow, Key } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
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
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToolToggle = (tool: string) => {
    setSettings(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        [tool]: !prev.tools[tool as keyof typeof prev.tools]
      }
    }));
  };

  return (
    <div className="app-skeleton">
      <div className="segment-topbar">
        <div className="segment-topbar__header mb-1">
          <div className="segment-topbar__overline text-overline">System Configuration</div>
          <h1 className="segment-topbar__title text-heading1">Settings</h1>
        </div>
        <div className="segment-topbar__aside">
          <button className="glowbutton3 glowbutton3--primary mr-2">
            <span className="button__content">
              <Save className="button__icon" />
              Save Changes
            </span>
          </button>
          <button className="glowbutton3">
            <span className="button__content">
              <RefreshCw className="button__icon" />
              Reset
            </span>
          </button>
        </div>
      </div>

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
                  className="w-full bg-transparent border-0 text-primary-500"
                  value={settings.model}
                  onChange={(e) => handleSettingChange('model', e.target.value)}
                >
                  <option value="deepseek/deepseek-r1:free">Deepseek-r1</option>
                  <option value="mistralai/devstral-small:free">Devstral-small</option>
                  <option value="google/gemini-pro:free">Gemini Pro</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label" htmlFor="temperature">Temperature: {settings.temperature}</label>
              <div className="form-control">
                <input 
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
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
                  value={settings.maxTokens}
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
                    value={settings.apiKey}
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
                checked={settings.streamingEnabled}
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
                  className="w-full bg-transparent border-0 text-primary-500"
                  value={settings.securityLevel}
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
                        checked={settings.tools.securityScanner}
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
                        checked={settings.tools.codeAnalysis}
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
                        checked={settings.tools.dataOperations}
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
                        checked={settings.tools.networkMonitor}
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
                checked={settings.debugMode}
                onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="debugMode" className="text-primary-500">Enable debug mode</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 