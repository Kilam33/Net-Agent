import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__section">
          <span className="app-footer__text">Varys Net-Agent v1.0.0</span>
        </div>
        <div className="app-footer__section">
          <span className="app-footer__text">Status: Online</span>
        </div>
        <div className="app-footer__section">
          <span className="app-footer__text">Model: meta-llama/llama-3.3-70b-instruct</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 