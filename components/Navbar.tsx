
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import logo from '../images/logo.png';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  const handleLogoClick = () => {
    onNavigate('/');
    
    const now = Date.now();
    if (now - lastTapTime < 500) {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        window.dispatchEvent(new CustomEvent('toggleAdmin'));
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'leaderboard_settings'), (docSnap) => {
      if (docSnap.exists()) {
        setIsLeaderboardVisible(docSnap.data().isVisible || false);
      }
    });
    return () => unsub();
  }, []);

  const links = isLeaderboardVisible 
    ? [...NAV_LINKS, { label: 'Leaderboard', path: '/leaderboard' }]
    : NAV_LINKS;

  return (
    <div className="absolute top-0 w-full z-50 p-4 md:p-6 pointer-events-none">
      <nav className="pointer-events-auto max-w-7xl mx-auto bg-white dark:bg-slate-900 border-[2px] border-black dark:border-white py-3 px-6 rounded-xl shadow-xl flex items-center justify-between transition-all">
        <div 
          className="flex items-center gap-4 md:gap-6 cursor-pointer group"
          onClick={handleLogoClick}
        >
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="logo"
              className="h-12 md:h-14 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="h-8 lg:h-10 w-[2px] bg-black/20 dark:bg-white/20"></div>

          <div className='flex flex-col lg:flex-row items-start lg:items-center gap-0.5 lg:gap-2 text-[8px] lg:text-[10px] font-extrabold uppercase tracking-[0.2em] text-black dark:text-white leading-none'>
            <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            <span>Ideate</span>
            <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            <span>Innovate</span>
            <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            <span>Impact</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`px-5 py-2 border-[2px] rounded-xl font-black text-xs uppercase transition-all
                ${link.path === '/leaderboard'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-1 active:translate-y-1'
                  : currentPath === link.path 
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[4px_4px_0px_0px_#FACC15]' 
                    : 'bg-white dark:bg-slate-900 text-black dark:text-white border-black dark:border-white hover:bg-gray-100 dark:hover:bg-slate-800 hover:-translate-y-0.5'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 border-[2px] rounded-lg border-black dark:border-white bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-900 border-[2px] border-black dark:border-white rounded-xl p-3 flex flex-col gap-2 shadow-xl pointer-events-auto">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setIsOpen(false);
              }}
              className={`w-full text-center px-6 py-3 border-[2px] rounded-lg border-black dark:border-white font-black text-sm uppercase transition-all
                ${link.path === '/leaderboard'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : currentPath === link.path 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-[3px_3px_0px_0px_#FACC15]' 
                    : 'bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800'}`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
