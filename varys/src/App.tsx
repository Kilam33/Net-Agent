import React from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import Footer from './components/layout/Footer';

const App: React.FC = () => {
  return (
    <div className="app-skeleton">
      <header className="app-header">
        <Navbar />
      </header>
      <div className="app-container">
        <aside className="app-a">
          <Sidebar />
        </aside>
        <main className="app-main">
          <Dashboard />
        </main>
        <aside className="app-b">
          <div className="pad">
            <div className="pad__body">
              <h2 className="segment-topbar__title">About Varys</h2>
              <p>
                Varys is an advanced AI assistant powered by the latest language models. 
                It can help you with a wide range of tasks, from answering questions to 
                providing detailed analysis and insights.
              </p>
            </div>
          </div>
        </aside>
        <footer className="app-footer">
          <Footer />
        </footer>
      </div>
    </div>
  );
};

export default App; 