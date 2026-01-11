import React from 'react';
import { Mail, MapPin, Instagram, Linkedin, Rocket } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import { NavItem } from '../types';

const Footer: React.FC = () => {
  const socialLinks = [
    { Icon: Instagram, href: 'https://www.instagram.com/iedccek/', label: 'Instagram' },
    { Icon: Linkedin, href: 'https://www.linkedin.com/company/iedc-ce-kidangoor/', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-2xl text-white tracking-tight">IEDC CEK</h3>
          </div>
          <p className="text-slate-400 max-w-sm">
            Empowering the next generation of innovators and entrepreneurs at the College of Engineering Kidangoor.
          </p>
          <div className="flex gap-3">
            {socialLinks.map(({ Icon, href, label }, i) => (
              <a 
                key={i} 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-white/5 hover:text-white transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            {NAV_LINKS.map((item: NavItem) => (
              <li key={item.path}>
                <a 
                  href={item.path === '/' ? '#' : `#${item.path}`} 
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Contact Us</h4>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3 items-start">
              <MapPin size={18} className="shrink-0 text-blue-500" />
              <span>College of Engineering Kidangoor<br />Kottayam, Kerala 686572</span>
            </div>
            <div className="flex gap-3 items-center">
              <Mail size={18} className="text-blue-500" />
              <span>iedc@ce-kgr.org</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-4 text-xs font-medium">
        <p>© 2025 IEDC College of Engineering Kidangoor. All rights reserved.</p>
        <p>Built by Amil Mether, CTO.</p>
      </div>
    </footer>
  );
};

export default Footer;