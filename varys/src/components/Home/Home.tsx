import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Brain, Workflow, Shield, Code, Database } from 'lucide-react';

export const Home: React.FC = () => {
  const networkRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!networkRef.current) return;

    const width = 600;
    const height = 400;

    // Clear existing content
    const svg = networkRef.current;
    svg.innerHTML = '';

    // Create nodes and links data
    const nodes = [
      { id: "agent", group: 1 },
      { id: "security", group: 2 },
      { id: "data", group: 3 },
      { id: "code", group: 4 },
      { id: "network", group: 5 }
    ];

    const links = [
      { source: "agent", target: "security" },
      { source: "agent", target: "data" },
      { source: "agent", target: "code" },
      { source: "agent", target: "network" },
      { source: "security", target: "network" },
      { source: "data", target: "code" }
    ];

    // Create SVG elements
    const linkElements = links.map(link => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("stroke", "var(--colors-primary--500)");
      line.setAttribute("stroke-opacity", "0.6");
      line.setAttribute("stroke-width", "2");
      return line;
    });

    const nodeElements = nodes.map(node => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "8");
      circle.setAttribute("fill", "var(--colors-secondary--500)");
      circle.setAttribute("stroke", "var(--colors-bg--300)");
      circle.setAttribute("stroke-width", "2");
      return circle;
    });

    const labelElements = nodes.map(node => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = node.id;
      text.setAttribute("fill", "var(--colors-tertiary--500)");
      text.setAttribute("font-size", "12px");
      text.setAttribute("font-family", "var(--fonts-secondary)");
      text.setAttribute("dx", "12");
      text.setAttribute("dy", "4");
      return text;
    });

    // Add elements to SVG
    linkElements.forEach(link => svg.appendChild(link));
    nodeElements.forEach(node => svg.appendChild(node));
    labelElements.forEach(label => svg.appendChild(label));

    // Simple animation
    let angle = 0;
    const radius = 150;
    const centerX = width / 2;
    const centerY = height / 2;

    const animate = () => {
      nodes.forEach((node, i) => {
        const nodeAngle = angle + (i * (2 * Math.PI / nodes.length));
        const x = centerX + radius * Math.cos(nodeAngle);
        const y = centerY + radius * Math.sin(nodeAngle);

        // Update node position
        const nodeElement = nodeElements[i];
        nodeElement.setAttribute("cx", x.toString());
        nodeElement.setAttribute("cy", y.toString());

        // Update label position
        const labelElement = labelElements[i];
        labelElement.setAttribute("x", x.toString());
        labelElement.setAttribute("y", y.toString());

        // Update link positions
        links.forEach((link, j) => {
          const sourceNode = nodes.find(n => n.id === link.source);
          const targetNode = nodes.find(n => n.id === link.target);
          if (sourceNode && targetNode) {
            const sourceIndex = nodes.indexOf(sourceNode);
            const targetIndex = nodes.indexOf(targetNode);
            const sourceAngle = angle + (sourceIndex * (2 * Math.PI / nodes.length));
            const targetAngle = angle + (targetIndex * (2 * Math.PI / nodes.length));
            
            const sourceX = centerX + radius * Math.cos(sourceAngle);
            const sourceY = centerY + radius * Math.sin(sourceAngle);
            const targetX = centerX + radius * Math.cos(targetAngle);
            const targetY = centerY + radius * Math.sin(targetAngle);

            const linkElement = linkElements[j];
            linkElement.setAttribute("x1", sourceX.toString());
            linkElement.setAttribute("y1", sourceY.toString());
            linkElement.setAttribute("x2", targetX.toString());
            linkElement.setAttribute("y2", targetY.toString());
          }
        });
      });

      angle += 0.005;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup animation
      svg.innerHTML = '';
    };
  }, []);

  return (
    <div className="custom-scrollbar" style={{ height: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
      <div className="space-y-8 p-4 pb-10">
        <div className="pad">
          <div className="pad__body">
            <h1 className="text-heading1 text-secondary-500 mb-4">Night-City NetWire Agent</h1>
            <p className="text-paragraph1 mb-6">
              Advanced AI agent system for cybersecurity, development, and system engineering.
              Equipped with cutting-edge tools and capabilities for technical operations.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Link to="/chat" className="cyber-card aug-border aug-border-all" role="radio" aria-checked="true">
                <div className="cyber-card__body">
                  <Terminal className="cyber-card__icon w-8 h-8" />
                  <h3 className="cyber-card__title">AI Terminal</h3>
                  <p className="cyber-card__description">Interactive AI agent interface with advanced capabilities</p>
                  <div className="cyber-card__glitch"></div>
                </div>
                <div className="ridge ridge--top"></div>
                <div className="ridge ridge--right"></div>
                <div className="ridge ridge--bottom"></div>
                <div className="ridge ridge--left"></div>
                <div className="edge edge--top-right"></div>
                <div className="edge edge--bottom-left"></div>
                <div className="punchout punchout--top-right"></div>
                <div className="punchout punchout--bottom-left"></div>
                <div className="cutout cutout--top"></div>
                <div className="cutout cutout--bottom"></div>
              </Link>
              <div className="cyber-card aug-border aug-border-all" role="radio" aria-checked="false">
                <div className="cyber-card__body">
                  <Brain className="cyber-card__icon w-8 h-8" />
                  <h3 className="cyber-card__title">Neural Engine</h3>
                  <p className="cyber-card__description">Advanced language processing and decision making</p>
                  <div className="cyber-card__glitch"></div>
                </div>
                <div className="ridge ridge--top"></div>
                <div className="ridge ridge--right"></div>
                <div className="ridge ridge--bottom"></div>
                <div className="ridge ridge--left"></div>
                <div className="edge edge--top-right"></div>
                <div className="edge edge--bottom-left"></div>
                <div className="punchout punchout--top-right"></div>
                <div className="punchout punchout--bottom-left"></div>
                <div className="cutout cutout--top"></div>
                <div className="cutout cutout--bottom"></div>
              </div>
              <div className="cyber-card aug-border aug-border-all" role="radio" aria-checked="false">
                <div className="cyber-card__body">
                  <Workflow className="cyber-card__icon w-8 h-8" />
                  <h3 className="cyber-card__title">Tool Integration</h3>
                  <p className="cyber-card__description">Seamless integration with development and security tools</p>
                  <div className="cyber-card__glitch"></div>
                </div>
                <div className="ridge ridge--top"></div>
                <div className="ridge ridge--right"></div>
                <div className="ridge ridge--bottom"></div>
                <div className="ridge ridge--left"></div>
                <div className="edge edge--top-right"></div>
                <div className="edge edge--bottom-left"></div>
                <div className="punchout punchout--top-right"></div>
                <div className="punchout punchout--bottom-left"></div>
                <div className="cutout cutout--top"></div>
                <div className="cutout cutout--bottom"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pad">
          <div className="pad__body">
            <h2 className="text-heading2 text-secondary-500 mb-4">System Overview</h2>
            <div className="flex justify-center">
              <svg 
                ref={networkRef} 
                className="network-visualization" 
                width="600" 
                height="400"
                style={{
                  filter: 'drop-shadow(0 0 5px var(--colors-primary--500))'
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="pad">
            <div className="pad__body">
              <Shield className="w-6 h-6 mb-2 text-secondary-500" />
              <h3 className="text-heading3 mb-2">Security Analysis</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-primary-500">
                <li>Vulnerability scanning</li>
                <li>Threat detection</li>
                <li>Security auditing</li>
              </ul>
            </div>
          </div>

          <div className="pad">
            <div className="pad__body">
              <Code className="w-6 h-6 mb-2 text-secondary-500" />
              <h3 className="text-heading3 mb-2">Code Intelligence</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-primary-500">
                <li>Code analysis</li>
                <li>Automated refactoring</li>
                <li>Best practices</li>
              </ul>
            </div>
          </div>

          <div className="pad">
            <div className="pad__body">
              <Database className="w-6 h-6 mb-2 text-secondary-500" />
              <h3 className="text-heading3 mb-2">Data Operations</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-primary-500">
                <li>Query optimization</li>
                <li>Schema analysis</li>
                <li>Data modeling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 