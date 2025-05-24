import React from 'react';
import { Search, PlusCircle, MessageSquare } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="app-a h-full">
      <div className="segment-topbar">
        <div className="segment-topbar__header">
          <h3 className="segment-topbar__title text-heading3">Conversations</h3>
        </div>
        <div className="segment-topbar__aside">
          <div className="button-toolbar">
            <a className="button button--primary button--size-lg">
              <PlusCircle className="button__icon" />
            </a>
          </div>
        </div>
      </div>
      
      <form className="form-search" onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <div className="form-control form-control--with-addon">
            <input name="query" placeholder="Search..." type="text" />
            <div className="form-control__addon form-control__addon--prefix">
              <Search className="h-5 w-5" />
            </div>
          </div>
        </div>
      </form>
      
      <div className="nav-section">
        <div className="nav-section__header">
          <h2 className="nav-section__title">Recent Chats</h2>
        </div>
        <div className="nav-section__body">
          <ul className="nav">
            <li className="nav__item">
              <a className="nav__link nav__link--active" href="#">
                <span className="conversation-link conversation-link--online">
                  <span className="conversation-link__icon"></span>
                  <span className="conversation-link__element">Python Help</span>
                </span>
              </a>
            </li>
            <li className="nav__item">
              <a className="nav__link" href="#">
                <span className="conversation-link">
                  <span className="conversation-link__icon"></span>
                  <span className="conversation-link__element">React Components</span>
                </span>
              </a>
            </li>
            <li className="nav__item">
              <a className="nav__link" href="#">
                <span className="conversation-link">
                  <span className="conversation-link__icon"></span>
                  <span className="conversation-link__element">SQL Queries</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="nav-section">
        <div className="nav-section__header">
          <h2 className="nav-section__title">Tools</h2>
        </div>
        <div className="nav-section__body">
          <ul className="nav">
            <li className="nav__item">
              <a className="nav__link" href="#">
                <span className="channel-link">
                  <span className="channel-link__icon">#</span>
                  <span className="channel-link__element">knowledge-search</span>
                </span>
              </a>
            </li>
            <li className="nav__item">
              <a className="nav__link" href="#">
                <span className="channel-link">
                  <span className="channel-link__icon">#</span>
                  <span className="channel-link__element">add-to-knowledge</span>
                </span>
              </a>
            </li>
            <li className="nav__item">
              <a className="nav__link" href="#">
                <span className="channel-link">
                  <span className="channel-link__icon">#</span>
                  <span className="channel-link__element">current-time</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};