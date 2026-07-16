
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import logo from '../images/logo.jpeg';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b-[4px] border-black dark:border-white py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('/')}
        >
          <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-yellow-400/70 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
            <img
              src={logo}
              alt="logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl tracking-tighter leading-none">IEDC CEKGR</span>
             <div className='flex item-center gap-2 mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300'>
             <span>Ideate</span>
             <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1"></span>
             <span>Innovate</span>
             <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1"></span>
             <span>Impact</span>
             </div>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`px-5 py-2 border-[3px] rounded-[10px] border-black dark:border-white font-black text-sm uppercase transition-all
                ${link.path === '/leaderboard'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-1 active:translate-y-1'
                  : currentPath === link.path 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-[#00FFFF] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-1 active:translate-y-1'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 border-[3px] border-black dark:border-white bg-white dark:bg-slate-900" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b-[4px] border-black dark:border-white p-4 space-y-2">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setIsOpen(false);
              }}
              className={`w-full text-left px-6 py-4 border-[3px] border-black dark:border-white font-black uppercase
                ${link.path === '/leaderboard'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : currentPath === link.path 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-[#FFDE03] text-black'}`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
