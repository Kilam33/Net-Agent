import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  return (
    <div className="app-skeleton h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};