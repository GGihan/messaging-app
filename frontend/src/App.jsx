import './App.css';
import { Outlet } from 'react-router';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import MainNav from './components/MainNav/MainNav';

export default function App() {

  return (
    <div className="app-shell">
      <div className="app-header">
        <Header />
      </div>

      <div className="app-body">
        <div className="app-nav">
          <MainNav />
        </div>
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <div className="app-footer">
        <Footer />
      </div>
    </div>
  );
};
