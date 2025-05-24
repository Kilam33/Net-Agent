import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer p-4 border-t border-primary-600">
      <div className="flex justify-between items-center">
        <div className="text-sm text-secondary-500">
          Night-City NetWire © 2025
        </div>
        <div className="text-sm text-primary-300">
          <span className="text-overline">NetWire_Seed: d869db7fe62fb07c25a0403ecaea55031744b5fb</span>
        </div>
      </div>
    </footer>
  );
};