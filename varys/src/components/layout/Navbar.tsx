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
    { text: 'Dashboard', icon: <FaComments />, isActive: true, notificationCount: 11 },
    { text: 'Shop', icon: <FaShoppingCart />, notificationCount: 0 },
    { text: 'Map', icon: <FaMap />, notificationCount: 0 },
    { text: 'Files', icon: <FaFolder />, notificationCount: 0 },
  ];

  return (
    <div className="flex items-center justify-between">
      <a href="/" className="app-header__anchor">
        <span className="app-header__anchor__text">Varys</span>
      </a>
      <nav>
        <ul className="nav">
          {navItems.map((item, index) => (
            <li key={index} className="nav__item">
              <a
                href="#"
                className={`nav__link ${item.isActive ? 'nav__link--active' : ''}`}
              >
                <span className="nav__link__element">{item.text}</span>
                {(item.notificationCount ?? 0) > 0 && (
                  <span className="nav__link__element">
                    <span className="badge">{item.notificationCount}</span>
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Navbar; 