import './App.css';
import { Outlet, useMatches } from 'react-router';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import MainNav from './components/MainNav/MainNav';
import ChatWindow from './components/ChatWindow/ChatWindow';
import { useChatStore } from './store/useChatStore';

export default function App() {
  const matches = useMatches();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const isChatOpen = Boolean(activeChatId);

  // Checks if any nested route declared hideMobileNav on mobile (e.g. /chats/new)
  const isMobileNavHiddenByRoute = matches.some(
    (match) => match.handle?.hideMobileNav
  );

  return (
    <div className="app-shell">
      <div className="app-header">
        <Header />
      </div>

      <div 
        className="app-body"
        data-chat-open={isChatOpen ? "true" : undefined}
        data-hide-nav={isMobileNavHiddenByRoute ? "true" : undefined}
      >
        <div className="app-nav">
          <MainNav />
        </div>
        <main className="app-main">
          <Outlet />
        </main>
        <section className="app-detail">
          {isChatOpen ? (
            <ChatWindow />
          ) : (
            <div className="empty-chat-state">
              <p>Select a chat to begin messaging</p>
            </div>
          )}
        </section>
      </div>

      <div className="app-footer">
        <Footer />
      </div>
    </div>
  );
};
