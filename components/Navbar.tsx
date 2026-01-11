
import React, { useState } from 'react';
import { Menu, X, Rocket } from 'lucide-react';
import { NAV_LINKS } from '../constants';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-[4px] border-black py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('/')}
        >
          <div className="p-2 bg-[#FFDE03] border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-transform">
            <Rocket className="w-6 h-6 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl tracking-tighter leading-none">IEDC CEK</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Neo-Innovation</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`px-5 py-2 border-[3px] border-black font-black text-sm uppercase transition-all
                ${currentPath === link.path 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-[#00FFFF] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 border-[3px] border-black bg-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b-[4px] border-black p-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setIsOpen(false);
              }}
              className={`w-full text-left px-6 py-4 border-[3px] border-black font-black uppercase
                ${currentPath === link.path ? 'bg-black text-white' : 'bg-[#FFDE03]'}`}
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
