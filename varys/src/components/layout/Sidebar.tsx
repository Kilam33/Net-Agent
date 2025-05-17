import React from 'react';

interface ChatSession {
  id: string;
  name: string;
  unread?: number;
  isPrivate?: boolean;
}

const Sidebar: React.FC = () => {
  const feeds: ChatSession[] = [
    { id: '5ba5', name: 'Afterlife', unread: 3 },
    { id: '4f22', name: 'NCPD-Gigs' },
    { id: 'fee9', name: 'Pacifica' },
    { id: 'a0cc', name: 'Watson' },
    { id: 'dee3', name: '_T_SQUAD', isPrivate: true, unread: 2 }
  ];

  const conversations: ChatSession[] = [
    { id: 'cc23', name: 'Rogue Amendiares', unread: 5 },
    { id: '95b4', name: 'Takemura', unread: 1 },
    { id: '10cf', name: 'Wakado O., Regina Jones' },
    { id: 'e466', name: 'Dexter DeShawn' },
    { id: 'ca0b', name: 'Megabuilding H10 Administration' }
  ];

  return (
    <div className="app-a">
      <div className="segment-topbar">
        <div className="segment-topbar__header">
          <h3 className="segment-topbar__title">Chats</h3>
        </div>
        <div className="segment-topbar__aside">
          <div className="button-toolbar">
            <a className="button button--primary button--size-lg">
              <span className="button__icon">+</span>
            </a>
          </div>
        </div>
      </div>

      <form className="form-search" onSubmit={e => e.preventDefault()}>
        <div className="form-group">
          <div className="form-control form-control--with-addon">
            <input name="query" placeholder="Search..." type="text" />
            <div className="form-control__addon form-control__addon--prefix">
              <span className="button__icon">🔍</span>
            </div>
          </div>
        </div>
      </form>

      <div className="nav-section">
        <div className="nav-section__header">
          <h2 className="nav-section__title">Feeds</h2>
        </div>
        <div className="nav-section__body">
          <ul className="nav">
            {feeds.map((feed) => (
              <li key={feed.id} className="nav__item">
                <a href="#" className={`nav__link ${feed.id === 'a0cc' ? 'nav__link--active' : ''}`}>
                  <span className="channel-link">
                    <span className="channel-link__icon">#</span>
                    <span className="channel-link__element">{feed.name}</span>
                    {feed.unread && (
                      <span className="channel-link__element">
                        <span className="badge">{feed.unread}</span>
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-section__header">
          <h2 className="nav-section__title">Direct</h2>
        </div>
        <div className="nav-section__body">
          <ul className="nav">
            {conversations.map((convo) => (
              <li key={convo.id} className="nav__item">
                <a href="#" className="nav__link">
                  <span className="conversation-link">
                    <span className="conversation-link__icon"></span>
                    <span className="conversation-link__element">{convo.name}</span>
                    {convo.unread && (
                      <span className="conversation-link__element">
                        <span className="badge">{convo.unread}</span>
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 