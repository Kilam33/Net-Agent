import React from 'react';
import { FaHome, FaComments, FaShoppingCart, FaMap, FaFolder } from 'react-icons/fa';

interface NavItem {
  text: string;
  icon: React.ReactNode;
  isActive?: boolean;
  notificationCount?: number;
}

const Navbar: React.FC = () => {
  const navItems: NavItem[] = [
    { text: 'Home', icon: <FaHome />, notificationCount: 0 },
    { text: 'Messages', icon: <FaComments />, isActive: true, notificationCount: 11 },
    { text: 'Shop', icon: <FaShoppingCart />, notificationCount: 0 },
    { text: 'Map', icon: <FaMap />, notificationCount: 0 },
    { text: 'Files', icon: <FaFolder />, notificationCount: 0 },
  ];

  return (
    <header className="app-header">
      <div className="app-header__anchor">
        <span className="app-header__anchor__text">Varys NetWire</span>
      </div>
      <nav>
        <ul className="flex items-end space-x-12">
          {navItems.map((item, index) => (
            <li key={index} className="nav__item">
              <a
                href="#"
                className={`
                  nav__link
                  flex items-baseline
                  text-shadow-glow
                  uppercase
                  transition-transform duration-250
                  hover:text-primary-200
                  ${item.isActive ? 'text-secondary-500 text-xl transform-none' : ''}
                `}
              >
                <span className="nav__link__element mr-2">{item.icon}</span>
                <span className="nav__link__element">{item.text}</span>
                {(item.notificationCount ?? 0) > 0 && (
                  <span className="nav__link__element ml-2">
                    <span className="badge">{item.notificationCount}</span>
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar; 