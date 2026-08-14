import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import AdminLogin from './AdminLogin';
import EventsAdmin from '../components/Admin/EventsAdmin';
import ExecomAdmin from '../components/Admin/ExecomAdmin';
import GalleryAdmin from '../components/Admin/GalleryAdmin';
import LegacyAdmin from '../components/Admin/LegacyAdmin';
import ExultAdmin from '../components/Admin/ExultAdmin';
import LeaderboardAdmin from '../components/Admin/LeaderboardAdmin';
import LiveStreamAdmin from '../components/Admin/LiveStreamAdmin';
import IdeasAdmin from '../components/Admin/IdeasAdmin';
import { LogOut, LayoutDashboard, Calendar, Users, Image as ImageIcon, Database, History, Zap, Trophy, Radio, Lightbulb } from 'lucide-react';

// We'll import initial data to seed database if empty
import { EVENTS, EXECOM_MEMBERS, GALLERY_ITEMS, TIMELINE_EVENTS, ACHIEVEMENTS, PAST_LEADERS } from '../constants';

const Admin: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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
    if (!window.confirm("This will add the hardcoded data to Firebase. Proceed?")) return;
    try {
      // Seed Events
      const eventsRef = collection(db, 'events');
      for (const event of EVENTS) {
        await addDoc(eventsRef, event);
      }
      // Seed Execom
      const execomRef = collection(db, 'execom');
      for (const member of EXECOM_MEMBERS) {
        await addDoc(execomRef, member);
      }
      // Seed Gallery
      const galleryRef = collection(db, 'gallery');
      for (const item of GALLERY_ITEMS) {
        await addDoc(galleryRef, item);
      }
      // Seed Timeline
      const timelineRef = collection(db, 'timeline');
      for (const item of TIMELINE_EVENTS) {
        await addDoc(timelineRef, item);
      }
      // Seed Achievements
      const achievementsRef = collection(db, 'achievements');
      for (const item of ACHIEVEMENTS) {
        await addDoc(achievementsRef, item);
      }
      // Seed Past Leaders
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
    if (!window.confirm("WARNING: This will delete ALL data in the events, execom, gallery, timeline, achievements, and past_leaders collections. Use this to clear duplicates. Proceed?")) return;
    
    try {
      const collectionsToClear = ['events', 'execom', 'gallery', 'timeline', 'achievements', 'past_leaders'];
      
      for (const col of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, col));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, col, document.id)));
        await Promise.all(deletePromises);
      }
      alert("Database wiped! You can now click 'Seed Database' just ONCE to restore the correct data.");
    } catch (error) {
      console.error("Error wiping database:", error);
      alert("Error resetting database. Check console.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-700">Quick Actions</h3>
                <button 
                  onClick={handleSeedDatabase}
                  className="mt-4 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Seed Database (Initial Load)
                </button>
                <button 
                  onClick={handleResetDatabase}
                  className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Reset Database (Clear All)
                </button>
              </div>
            </div>
          </div>
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-blue-600">IEDC Admin</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'execom', label: 'Execom Members', icon: Users },
            { id: 'gallery', label: 'Gallery', icon: ImageIcon },
            { id: 'legacy', label: 'Legacy Page', icon: History },
            { id: 'exult', label: 'Exult 2026', icon: Zap },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'live_stream', label: 'Live Stream', icon: Radio },
            { id: 'ideas', label: 'Idea Submissions', icon: Lightbulb },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Admin;
