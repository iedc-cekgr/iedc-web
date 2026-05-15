import logo from './images/logo.jpeg';
import React from 'react';
import { Mail, MapPin, Instagram, Linkedin } from 'lucide-react';
import { NAV_LINKS } from './constants';
import { NavItem } from './types';


const Footer: React.FC = () => {
  const socialLinks = [
    { Icon: Instagram, href: 'https://www.instagram.com/iedccek/', label: 'Instagram' },
    { Icon: Linkedin, href: 'https://www.linkedin.com/company/iedc-ce-kidangoor/', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-[#FFDE03] border-t-[8px] border-black py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black border-[3px] border-black">
              <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
            </div>
            <h3 className="font-display font-black text-4xl">IEDC CEK</h3>
          </div>
          <p className="text-xl font-black leading-tight max-w-md">
            THE ENGINE ROOM OF INNOVATION AT COLLEGE OF ENGINEERING KIDANGOOR.
          </p>
          <div className="flex gap-4">
            {socialLinks.map(({ Icon, href, label }, i) => (
              <a 
                key={i} 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-14 h-14 bg-white border-[3px] border-black flex items-center justify-center hover:bg-black group transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 hover:translate-x-1 hover:translate-y-1"
              >
                <Icon size={24} className="group-hover:text-white" />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h4 className="text-2xl font-black uppercase border-b-[4px] border-black inline-block">LINKS</h4>
          <ul className="space-y-4 font-black uppercase text-lg">
            {NAV_LINKS.map((item: NavItem) => (
              <li key={item.path}>
                <a 
                  href={item.path === '/' ? '#' : `#${item.path}`} 
                  className="hover:bg-black hover:text-white px-2 py-1 transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-2xl font-black uppercase border-b-[4px] border-black inline-block">FIND US</h4>
          <div className="space-y-6 font-bold text-lg">
            <div className="flex gap-3 items-start">
              <MapPin size={24} className="shrink-0" />
              <span>CE KIDANGOOR,<br />KERALA 686572</span>
            </div>
            <div className="flex gap-3 items-center">
              <Mail size={24} />
              <span>iedc@ce-kgr.org</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t-[4px] border-black flex flex-col md:flex-row justify-between gap-6 font-black uppercase tracking-tight">
        <p>© 2025 IEDC CE KIDANGOOR.</p>
        <p>BUILD BY TECHNICAL WING IEDC</p>
      </div>
    </footer>
  );
};

export default Footer;