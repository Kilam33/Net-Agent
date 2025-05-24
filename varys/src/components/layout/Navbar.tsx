import React from 'react';
import { Terminal } from 'lucide-react';

export const Navbar: React.FC = () => {
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
              <a href="#" className="nav__link flex items-center">
                <span className="nav__link__element">Home</span>
              </a>
            </li>
            <li className="nav__item">
              <a href="#" className="nav__link nav__link--active flex items-center">
                <span className="nav__link__element">Chat</span>
              </a>
            </li>
            <li className="nav__item">
              <a href="#" className="nav__link flex items-center">
                <span className="nav__link__element">Docs</span>
              </a>
            </li>
            <li className="nav__item">
              <a href="#" className="nav__link flex items-center">
                <span className="nav__link__element">Settings</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};