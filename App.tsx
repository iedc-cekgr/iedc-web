import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Execom from './pages/Execom';
import Projects from './pages/Projects';
import Events from './pages/Events';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setCurrentPath(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path === '/' ? '' : path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/': return <Home onNavigate={navigate} />;
      case '/about': return <About />;
      case '/execom': return <Execom />;
      case '/projects': return <Projects />;
      case '/events': return <Events />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-white selection:bg-[#FF00FF] selection:text-white">
      {/* Background patterns: Sharp grids instead of soft blur */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px]"></div>

      <Navbar currentPath={currentPath} onNavigate={navigate} />
      
      <main className="animate-in fade-in zoom-in-95 duration-200">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default App;