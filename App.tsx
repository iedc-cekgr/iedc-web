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
import Leaderboard from './pages/Leaderboard';
import ExultHome from './pages/exult/ExultHome';
import ExultEvent from './pages/exult/ExultEvent';
import ExultQuiz from './pages/exult/ExultQuiz';
import CslLive from './pages/CslLive';
import RegistrationPage from './pages/RegistrationPage';
import SubmitIdea from './pages/SubmitIdea';


const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdmin(prev => !prev);
      }
    };

    const handleToggleAdmin = () => {
      setShowAdmin(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggleAdmin', handleToggleAdmin);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggleAdmin', handleToggleAdmin);
    };
  }, []);

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

  // Detect custom domain for the event
  const hostname = window.location.hostname;
  const isCustomEventDomain = 
    (hostname !== 'localhost' && 
     hostname !== '127.0.0.1' && 
     !hostname.includes('iedc') && 
     !hostname.includes('vercel.app')) || 
    hostname.includes('csl') || 
    hostname.includes('auction');

  const isCslRoute = 
    currentPath === '/csl' || 
    currentPath === '/live' || 
    currentPath === '/auction' || 
    (isCustomEventDomain && currentPath === '/');

  const renderContent = () => {
    if (isCslRoute) {
      return <CslLive onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/exult/event/')) {
      const slug = currentPath.split('/exult/event/')[1];
      return <ExultEvent slug={slug} onNavigate={navigate} />;
    }
    
    if (currentPath.startsWith('/exult/quiz/')) {
      const regId = currentPath.split('/exult/quiz/')[1];
      return <ExultQuiz registrationId={regId} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/register/')) {
      const eventId = currentPath.split('/register/')[1];
      return <RegistrationPage eventId={eventId} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/execom/')) {
      const memberId = currentPath.split('/execom/')[1];
      return <Execom memberId={memberId} onNavigate={navigate} />;
    }

    switch (currentPath) {
      case '/': return <Home onNavigate={navigate} />;
      case '/execom': return <Execom onNavigate={navigate} />;
      case '/events': return <Events onNavigate={navigate} />;
      case '/gallery': return <Gallery />;
      case '/legacy': return <Projects />;
      case '/about': return <About />;
      case '/leaderboard': return <Leaderboard onNavigate={navigate} />;
      case '/exult': return <ExultHome onNavigate={navigate} />;
      case '/submit-idea': return <SubmitIdea onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  if (isCslRoute) {
    return (
      <main className="animate-in fade-in duration-500 bg-[#020704]">
        {renderContent()}
      </main>
    );
  }

  if (showAdmin) {
    return (
      <main className="animate-in fade-in duration-500">
        <Admin />
      </main>
    );
  }

  if (currentPath === '/leaderboard') {
    return (
      <main className="animate-in fade-in duration-500 bg-[#060112]">
        {renderContent()}
      </main>
    );
  }

  if (currentPath.startsWith('/exult')) {
    return (
      <main className="animate-in fade-in duration-500 bg-[#050B08]">
        {renderContent()}
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-600 selection:text-white">
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