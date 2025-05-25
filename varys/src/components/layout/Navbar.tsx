import React from 'react';
import { Terminal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="app-header px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="app-header__anchor flex items-center">
          <Terminal className="mr-2 text-primary-500" />
          <span className="app-header__anchor__text">Night-City NetWire</span>
        </div>
        
        <nav>
          <ul className="nav flex space-x-12">
            <li className="nav__item">
              <Link to="/" className={`nav__link flex items-center ${location.pathname === '/' ? 'nav__link--active' : ''}`}>
                <span className="nav__link__element">Home</span>
              </Link>
            </li>
            <li className="nav__item">
              <Link to="/chat" className={`nav__link flex items-center ${location.pathname === '/chat' ? 'nav__link--active' : ''}`}>
                <span className="nav__link__element">Chat</span>
              </Link>
            </li>
            <li className="nav__item">
              <Link to="/docs" className={`nav__link flex items-center ${location.pathname === '/docs' ? 'nav__link--active' : ''}`}>
                <span className="nav__link__element">Docs</span>
              </Link>
            </li>
            <li className="nav__item">
              <Link to="/settings" className={`nav__link flex items-center ${location.pathname === '/settings' ? 'nav__link--active' : ''}`}>
                <span className="nav__link__element">Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};