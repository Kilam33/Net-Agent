import React, { useState } from 'react';
import { 
  Book, 
  Code2, 
  Shield, 
  Network, 
  Terminal, 
  Zap, 
  Search, 
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// Type definition for documentation example
interface NetAgent {
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  status: 'active' | 'inactive' | 'error';
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  status: 'stable' | 'beta' | 'experimental';
}

export const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveDemo, setIsLiveDemo] = useState(false);

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      status: 'stable',
      content: (
        <div className="space-y-6">
          <div className="pad">
            <div className="pad__body">
              <h3 className="text-heading3 text-secondary-500 mb-4">Quick Start Guide</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-secondary-500" />
                  <code className="text-sm bg-bg-300 px-2 py-1 rounded">npm install net-agent</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-secondary-500" />
                  <code className="text-sm bg-bg-300 px-2 py-1 rounded">{`import { NetAgent } from 'net-agent'`}</code>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pad">
            <div className="pad__body">
              <h3 className="text-heading3 text-secondary-500 mb-4">System Requirements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-active-500" />
                    <span>Node.js 18+</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-active-500" />
                    <span>4GB RAM minimum</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-active-500" />
                    <span>Modern browser</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-active-500" />
                    <span>Internet connection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security Features',
      icon: <Shield className="w-5 h-5" />,
      status: 'stable',
      content: (
        <div className="space-y-6">
          <div className="pad">
            <div className="pad__body">
              <h3 className="text-heading3 text-secondary-500 mb-4">Security Protocols</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-500">1</span>
                  </div>
                  <div>
                    <h4 className="text-heading4 text-secondary-500 mb-2">End-to-End Encryption</h4>
                    <p className="text-sm text-primary-500">All communications are encrypted using AES-256-GCM with perfect forward secrecy.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-500">2</span>
                  </div>
                  <div>
                    <h4 className="text-heading4 text-secondary-500 mb-2">Zero Trust Architecture</h4>
                    <p className="text-sm text-primary-500">Implements strict access controls and continuous verification of all system components.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pad">
            <div className="pad__body">
              <h3 className="text-heading3 text-secondary-500 mb-4">Live Security Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Encryption Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-active-500 animate-pulse"></div>
                    <span className="text-sm text-active-500">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Threat Detection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-active-500 animate-pulse"></div>
                    <span className="text-sm text-active-500">Monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: <Code2 className="w-5 h-5" />,
      status: 'beta',
      content: (
        <div className="space-y-6">
          <div className="pad">
            <div className="pad__body">
              <h3 className="text-heading3 text-secondary-500 mb-4">Interactive API Explorer</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <button 
                    className="glowbutton3 glowbutton3--primary"
                    onClick={() => setIsLiveDemo(!isLiveDemo)}
                  >
                    <div className="button__content">
                      {isLiveDemo ? (
                        <>
                          <Pause className="button__icon" />
                          <span>Stop Demo</span>
                        </>
                      ) : (
                        <>
                          <Play className="button__icon" />
                          <span>Start Live Demo</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
                
                {isLiveDemo && (
                  <div className="pad">
                    <div className="pad__body">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-heading4 text-secondary-500">Real-time API Response</h4>
                        <RefreshCw className="w-4 h-4 text-secondary-500 animate-spin" />
                      </div>
                      <pre className="text-sm bg-bg-300 p-4 rounded overflow-x-auto">
                        {`{
  "status": "active",
  "endpoints": [
    "/api/v1/agents",
    "/api/v1/security",
    "/api/v1/network"
  ],
  "response_time": "23ms",
  "security_level": "high"
}`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'network',
      title: 'Network Operations',
      icon: <Network className="w-5 h-5" />,
      status: 'experimental',
      content: (
        <div className="space-y-6">
          <div className="pad">
            <div className="pad__body">
              <h3 className="text-heading3 text-secondary-500 mb-4">Network Topology</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-tertiary-500" />
                  <span className="text-sm text-tertiary-500">Experimental Feature</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="pad">
                    <div className="pad__body">
                      <h4 className="text-heading4 text-secondary-500 mb-2">Node Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Primary</span>
                          <div className="w-2 h-2 rounded-full bg-active-500"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Secondary</span>
                          <div className="w-2 h-2 rounded-full bg-active-500"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pad">
                    <div className="pad__body">
                      <h4 className="text-heading4 text-secondary-500 mb-2">Traffic</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Inbound</span>
                          <span className="text-sm text-active-500">1.2 MB/s</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Outbound</span>
                          <span className="text-sm text-active-500">0.8 MB/s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pad">
                    <div className="pad__body">
                      <h4 className="text-heading4 text-secondary-500 mb-2">Health</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Uptime</span>
                          <span className="text-sm text-active-500">99.9%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Latency</span>
                          <span className="text-sm text-active-500">23ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="custom-scrollbar" style={{ height: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
      <div className="p-4 pb-10">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="form-control form-control--with-addon">
              <div className="form-control__addon form-control__addon--prefix">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-primary-500">Status:</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-active-500"></div>
              <span className="text-sm text-active-500">Stable</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-tertiary-500"></div>
              <span className="text-sm text-tertiary-500">Beta</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              <span className="text-sm text-primary-500">Experimental</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <div className="pad sticky top-4">
              <div className="pad__body">
                <h2 className="text-heading2 text-secondary-500 mb-4">Documentation</h2>
                <nav className="space-y-2">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary-900 text-secondary-500'
                          : 'hover:bg-primary-900/50 text-primary-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {section.icon}
                        <span>{section.title}</span>
                      </div>
                      {activeSection === section.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            {filteredSections.map(section => (
              <div
                key={section.id}
                className={`space-y-6 ${activeSection === section.id ? 'block' : 'hidden'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <h2 className="text-heading2 text-secondary-500">{section.title}</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Status:</span>
                    <div className={`flex items-center space-x-1 ${
                      section.status === 'stable' ? 'text-active-500' :
                      section.status === 'beta' ? 'text-tertiary-500' :
                      'text-primary-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        section.status === 'stable' ? 'bg-active-500' :
                        section.status === 'beta' ? 'bg-tertiary-500' :
                        'bg-primary-500'
                      }`}></div>
                      <span className="text-sm capitalize">{section.status}</span>
                    </div>
                  </div>
                </div>
                {section.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 