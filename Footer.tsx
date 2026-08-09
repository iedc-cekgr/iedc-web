import logo from './images/logo.png';
import React from 'react';
import { Mail, MapPin, Instagram, Linkedin, ChevronRight } from 'lucide-react';
import { NAV_LINKS } from './constants';
import { NavItem } from './types';

const Footer: React.FC = () => {
  const socialLinks = [
    { Icon: Instagram, href: 'https://www.instagram.com/iedccek/', label: 'Instagram' },
    { Icon: Linkedin, href: 'https://www.linkedin.com/company/iedc-ce-kidangoor/', label: 'LinkedIn' },
  ];

  return (
    <div className="p-4 md:p-6 pb-6">
      <footer className="relative bg-[#FFDE03] text-black rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 overflow-hidden z-0 shadow-xl">
        
        {/* Decorative Backgrounds removed as requested */}

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-12 md:gap-24">
          
          {/* Left Column */}
          <div className="space-y-6">
            <img src={logo} alt="logo" className="h-14 md:h-20 w-auto object-contain" />
            <div className="h-[3px] w-10 bg-black mt-2"></div>
            <p className="font-bold text-base md:text-lg leading-snug max-w-sm mt-4">
              The engine room of innovation at College of Engineering Kidangoor.
            </p>
            <div className="flex gap-4 pt-4">
              {socialLinks.map(({ Icon, href, label }, i) => (
                <a 
                  key={i} 
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-12 h-12 border-[2px] border-black rounded-xl flex items-center justify-center hover:bg-black hover:text-[#FFDE03] transition-colors"
                >
                  <Icon size={24} />
                </a>
              ))}
            </div>
          </div>

          {/* Middle Column */}
          <div className="space-y-4">
            <div>
              <h4 className="font-black text-lg md:text-xl tracking-wide uppercase">LINKS</h4>
              <div className="h-[3px] w-8 bg-black mt-1"></div>
            </div>
            
            <ul className="flex flex-col">
              {NAV_LINKS.map((item: NavItem, index: number) => (
                <li key={item.path} className={`border-black ${index !== NAV_LINKS.length - 1 ? 'border-b-[1px] border-black/15' : ''}`}>
                  <a 
                    href={item.path === '/' ? '#' : `${item.path}`} 
                    className="flex items-center gap-3 py-3 font-bold uppercase hover:pl-2 transition-all text-sm md:text-base"
                  >
                    <ChevronRight size={18} strokeWidth={3} />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <h4 className="font-black text-lg md:text-xl tracking-wide uppercase">FIND US</h4>
              <div className="h-[3px] w-8 bg-black mt-1"></div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex gap-4 items-center py-4 border-b-[1px] border-black/15">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={22} strokeWidth={2.5} className="text-[#FFDE03]" />
                </div>
                <span className="font-bold text-xs md:text-sm leading-tight">CE KIDANGOOR,<br />KERALA 686572</span>
              </div>
              <div className="flex gap-4 items-center py-4 border-b-[1px] border-black/15 md:border-none">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={22} strokeWidth={2.5} className="text-[#FFDE03]" />
                </div>
                <span className="font-bold text-xs md:text-sm leading-tight">iedc@ce-kgr.org</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="relative z-10 max-w-7xl mx-auto mt-12 md:mt-16 pt-6 border-t-[2px] border-black flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-black text-xs md:text-sm">
            <span className="text-xl leading-none">©</span> 2025 IEDC CE KIDANGOOR.
          </div>
          <div className="flex items-center gap-2 md:gap-4 font-black text-[10px] md:text-xs tracking-widest text-center md:text-left">
            BUILD BY TECHNICAL WING IEDC
            <span className="text-lg md:text-xl tracking-tighter italic">///////</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;