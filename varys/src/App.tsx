import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { SettingsProvider } from './contexts/SettingsContext';
import { DebugProvider } from './contexts/DebugContext';

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <DebugProvider>
        <RouterProvider router={router} />
      </DebugProvider>
    </SettingsProvider>
  );
};

export default App;