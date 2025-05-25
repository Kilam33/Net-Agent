import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings/Settings';
import { Home } from './components/Home/Home';
import { Docs } from './components/Docs/Docs';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'chat',
        element: <Dashboard />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'docs',
        element: <Docs />
      }
    ]
  }
]); 