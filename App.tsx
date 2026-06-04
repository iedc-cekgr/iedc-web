import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './Footer';
import Home from './pages/Home';
import About from './pages/About';
import Execom from './pages/Execom';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Projects from './pages/Projects';
import Admin from './pages/Admin';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    if (window.location.hash && window.location.hash.length > 1) {
      const path = window.location.hash.replace('#', '');
      window.history.replaceState(null, '', path);
      setCurrentPath(path);
    }

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/': return <Home onNavigate={navigate} />;
      case '/execom': return <Execom />;
      case '/events': return <Events />;
      case '/gallery': return <Gallery />;
      case '/legacy': return <Projects />;
      case '/about': return <About />;
      case '/admin': return <Admin />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  if (currentPath === '/admin') {
    return (
      <main className="animate-in fade-in duration-500">
        <Admin />
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 selection:bg-blue-600 selection:text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <Navbar currentPath={currentPath} onNavigate={navigate} />
      
      <main className="animate-in fade-in duration-500">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default App;