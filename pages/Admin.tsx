import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import AdminLogin from './AdminLogin';
import AdminDashboard from '../components/Admin/AdminDashboard';
import EventsAdmin from '../components/Admin/EventsAdmin';
import ExecomAdmin from '../components/Admin/ExecomAdmin';
import GalleryAdmin from '../components/Admin/GalleryAdmin';
import LegacyAdmin from '../components/Admin/LegacyAdmin';
import ExultAdmin from '../components/Admin/ExultAdmin';
import LeaderboardAdmin from '../components/Admin/LeaderboardAdmin';
import LiveStreamAdmin from '../components/Admin/LiveStreamAdmin';
import IdeasAdmin from '../components/Admin/IdeasAdmin';
import FreshersAdmin from '../components/Admin/FreshersAdmin';

import logo from '../images/logo.png';

import { 
  LogOut, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Image as ImageIcon, 
  History, 
  Zap, 
  Trophy, 
  Radio, 
  Lightbulb, 
  UserPlus, 
  Menu, 
  X, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';

import { EVENTS, EXECOM_MEMBERS, GALLERY_ITEMS, TIMELINE_EVENTS, ACHIEVEMENTS, PAST_LEADERS } from '../constants';

const Admin: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSeedDatabase = async () => {
    try {
      const eventsRef = collection(db, 'events');
      for (const event of EVENTS) {
        await addDoc(eventsRef, event);
      }
      const execomRef = collection(db, 'execom');
      for (const member of EXECOM_MEMBERS) {
        await addDoc(execomRef, member);
      }
      const galleryRef = collection(db, 'gallery');
      for (const item of GALLERY_ITEMS) {
        await addDoc(galleryRef, item);
      }
      const timelineRef = collection(db, 'timeline');
      for (const item of TIMELINE_EVENTS) {
        await addDoc(timelineRef, item);
      }
      const achievementsRef = collection(db, 'achievements');
      for (const item of ACHIEVEMENTS) {
        await addDoc(achievementsRef, item);
      }
      const pastLeadersRef = collection(db, 'past_leaders');
      for (const item of PAST_LEADERS) {
        await addDoc(pastLeadersRef, item);
      }
      alert("Database seeded successfully!");
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("Error seeding database. Check console.");
    }
  };

  const handleResetDatabase = async () => {
    try {
      const collectionsToClear = ['events', 'execom', 'gallery', 'timeline', 'achievements', 'past_leaders'];
      
      for (const col of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, col));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, col, document.id)));
        await Promise.all(deletePromises);
      }
      alert("Database wiped successfully!");
    } catch (error) {
      console.error("Error wiping database:", error);
      alert("Error resetting database. Check console.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-700">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-xs uppercase tracking-wider text-slate-500">Loading Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events Manager', icon: Calendar },
    { id: 'execom', label: 'Execom Officers', icon: Users },
    { id: 'gallery', label: 'Gallery Photos', icon: ImageIcon },
    { id: 'legacy', label: 'Legacy Page', icon: History },
    { id: 'exult', label: 'Exult 2026 Fest', icon: Zap },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'live_stream', label: 'Live Stream', icon: Radio },
    { id: 'ideas', label: 'Idea Proposals', icon: Lightbulb },
    { id: 'freshers', label: 'Freshers Hub', icon: UserPlus },
  ];

  const currentTabLabel = navItems.find(i => i.id === activeTab)?.label || 'Dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboard 
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSeedDatabase={handleSeedDatabase}
            onResetDatabase={handleResetDatabase}
          />
        );
      case 'events':
        return <EventsAdmin />;
      case 'execom':
        return <ExecomAdmin />;
      case 'gallery':
        return <GalleryAdmin />;
      case 'legacy':
        return <LegacyAdmin />;
      case 'exult':
        return <ExultAdmin />;
      case 'leaderboard':
        return <LeaderboardAdmin />;
      case 'live_stream':
        return <LiveStreamAdmin />;
      case 'ideas':
        return <IdeasAdmin />;
      case 'freshers':
        return <FreshersAdmin />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img src={logo} alt="IEDC Logo" className="h-9 w-auto object-contain" />
          <div className="h-5 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              IEDC Admin
            </h1>
            <span className="text-[11px] font-medium text-blue-600 block">
              {currentTabLabel}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Header Section */}
          <div className="p-5 border-b border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="IEDC Logo" 
                className="h-11 w-auto object-contain shrink-0" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Control Panel
                  </span>
                </div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  IEDC Admin
                </h1>
              </div>
            </div>

            {/* Admin Email Display (iedc@ce-kgr.org) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Logged in as
                </span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  iedc@ce-kgr.org
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={15} className="text-blue-600" />}
                </button>
              );
            })}
          </nav>

          {/* Sign Out Footer */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl border border-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Admin;
