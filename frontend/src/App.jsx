import './App.css';
import { Outlet } from 'react-router';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import MainNav from './components/MainNav/MainNav';

function App() {

  return (
    <div className='app-container'>
      <Header />
      <MainNav />
      <main className='flex-column'>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default App;
