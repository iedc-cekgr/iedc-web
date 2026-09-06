import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  EVENTS, 
  EXECOM_MEMBERS, 
  GALLERY_ITEMS 
} from '../../constants';
import { 
  Calendar, 
  Zap, 
  Clock, 
  CheckCircle2,
  Lightbulb, 
  UserPlus, 
  Users, 
  Image as ImageIcon, 
  Database, 
  RotateCcw, 
  ArrowRight, 
  Sparkles,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import RethinkModal from './RethinkModal';

interface AdminDashboardProps {
  onNavigateTab: (tabId: string) => void;
  onSeedDatabase: () => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

interface StatsData {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalIdeas: number;
  totalFreshers: number;
  totalExecom: number;
  totalGallery: number;
  upcomingEventList: Array<{ id: string | number; title: string; date: string; type?: string }>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onSeedDatabase,
  onResetDatabase
}) => {
  const [stats, setStats] = useState<StatsData>({
    totalEvents: EVENTS.length,
    activeEvents: 0,
    upcomingEvents: 0,
    completedEvents: EVENTS.length,
    totalIdeas: 0,
    totalFreshers: 0,
    totalExecom: EXECOM_MEMBERS.length,
    totalGallery: GALLERY_ITEMS.length,
    upcomingEventList: []
  });

  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        // Fetch Events from Firestore
        const eventsSnap = await getDocs(collection(db, 'events'));
        const eventsList: any[] = [];
        eventsSnap.forEach(doc => {
          eventsList.push({ id: doc.id, ...doc.data() });
        });

        const effectiveEvents = eventsList.length > 0 ? eventsList : EVENTS;

        const now = new Date();
        let activeCount = 0;
        let upcomingCount = 0;
        let completedCount = 0;
        const upcomingList: any[] = [];

        effectiveEvents.forEach((ev) => {
          const parsedDate = new Date(ev.date);
          const isInvalidDate = isNaN(parsedDate.getTime());

          if (ev.status === 'live' || ev.status === 'active' || ev.isLive) {
            activeCount++;
          }

          if (ev.status === 'upcoming' || (!isInvalidDate && parsedDate >= now)) {
            upcomingCount++;
            if (upcomingList.length < 4) {
              upcomingList.push(ev);
            }
          } else {
            // Event date is in the past or marked completed
            completedCount++;
          }
        });

        // Fetch Ideas
        let ideasCount = 0;
        try {
          const ideasSnap = await getDocs(collection(db, 'ideas'));
          ideasCount = ideasSnap.size;
        } catch (e) {}

        // Fetch Freshers
        let freshersCount = 0;
        try {
          const freshersSnap = await getDocs(collection(db, 'first_year_registrations'));
          freshersCount = freshersSnap.size;
        } catch (e) {}

        // Fetch Execom
        let execomCount = EXECOM_MEMBERS.length;
        try {
          const execomSnap = await getDocs(collection(db, 'execom'));
          if (execomSnap.size > 0) execomCount = execomSnap.size;
        } catch (e) {}

        // Fetch Gallery
        let galleryCount = GALLERY_ITEMS.length;
        try {
          const gallerySnap = await getDocs(collection(db, 'gallery'));
          if (gallerySnap.size > 0) galleryCount = gallerySnap.size;
        } catch (e) {}

        setStats({
          totalEvents: effectiveEvents.length,
          activeEvents: activeCount,
          upcomingEvents: upcomingCount,
          completedEvents: completedCount,
          totalIdeas: ideasCount,
          totalFreshers: freshersCount,
          totalExecom: execomCount,
          totalGallery: galleryCount,
          upcomingEventList: upcomingList
        });

      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleConfirmReset = async () => {
    setActionLoading(true);
    try {
      await onResetDatabase();
    } finally {
      setActionLoading(false);
      setIsResetModalOpen(false);
    }
  };

  const handleConfirmSeed = async () => {
    setActionLoading(true);
    try {
      await onSeedDatabase();
    } finally {
      setActionLoading(false);
      setIsSeedModalOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
            <Sparkles size={14} className="text-yellow-300" />
            <span>IEDC Admin Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Control & Operations Hub
          </h1>
          <p className="text-sm text-blue-100 max-w-xl font-normal leading-relaxed">
            Monitor college event registrations, student startup proposals, executive team members, and media galleries.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('events')}
          className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <span>Manage Events</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Overview & Activity Metrics</span>
          </h2>
          {loading && (
            <span className="text-xs font-medium text-slate-400 animate-pulse">Syncing data...</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div 
            onClick={() => onNavigateTab('events')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar size={20} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                Total
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.totalEvents}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Total Events Created</p>
            </div>
          </div>

          {/* Upcoming Events */}
          <div 
            onClick={() => onNavigateTab('events')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-md">
                Scheduled
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.upcomingEvents}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Upcoming Events</p>
            </div>
          </div>

          {/* Completed / Past Events */}
          <div 
            onClick={() => onNavigateTab('events')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                Finished
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.completedEvents}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Completed / Past Events</p>
            </div>
          </div>

          {/* Active / Live Events */}
          <div 
            onClick={() => onNavigateTab('events')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Zap size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                Live Now
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.activeEvents}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Active Live Events</p>
            </div>
          </div>

          {/* Submitted Ideas */}
          <div 
            onClick={() => onNavigateTab('ideas')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Lightbulb size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                Proposals
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.totalIdeas}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Student Startup Ideas</p>
            </div>
          </div>

          {/* Freshers Registrations */}
          <div 
            onClick={() => onNavigateTab('freshers')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-pink-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                <UserPlus size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-pink-100 text-pink-700 rounded-md">
                Freshers
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.totalFreshers}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">First Year Registrations</p>
            </div>
          </div>

          {/* Execom Team */}
          <div 
            onClick={() => onNavigateTab('execom')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                Officers
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.totalExecom}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Execom Team Members</p>
            </div>
          </div>

          {/* Gallery Media */}
          <div 
            onClick={() => onNavigateTab('gallery')}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-cyan-300 shadow-xs hover:shadow-md rounded-2xl p-5 transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                <ImageIcon size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-cyan-100 text-cyan-700 rounded-md">
                Gallery
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">{stats.totalGallery}</span>
              <p className="text-xs font-medium text-slate-500 mt-1">Photos & Media Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts & Database Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shortcuts */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Quick Section Shortcuts</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'events', name: 'Events Manager', desc: 'Create and update campus events' },
              { id: 'exult', name: 'Exult 2026 Fest', desc: 'Manage fest activities & registrations' },
              { id: 'ideas', name: 'Idea Proposals', desc: 'Review student startup ideas' },
              { id: 'freshers', name: 'Freshers Hub', desc: 'First year newcomer signups' },
              { id: 'leaderboard', name: 'Leaderboard', desc: 'Promoter points & rankings' },
              { id: 'execom', name: 'Execom Team', desc: 'Officer roles & team members' },
            ].map((shortcut) => (
              <button
                key={shortcut.id}
                onClick={() => onNavigateTab(shortcut.id)}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {shortcut.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    {shortcut.desc}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Database Action Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
              <Database size={14} />
              <span>Data Utilities</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Database Seeding & Reset
            </h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              Populate default demo content or reset Firestore database collections.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setIsSeedModalOpen(true)}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              <Database size={15} />
              <span>Seed Initial Database</span>
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} />
              <span>Reset Database Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <RethinkModal
        isOpen={isResetModalOpen}
        title="Reset Database Collections"
        description="This will clear stored events, execom, gallery, timeline, achievements, and past_leaders collections in Firebase. Are you sure?"
        itemName="All Firestore Collections"
        confirmText="Yes, Reset Database"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
        isLoading={actionLoading}
      />

      <RethinkModal
        isOpen={isSeedModalOpen}
        title="Seed Initial Database"
        description="This will populate initial default events, execom members, gallery photos, and timeline records into Firebase."
        itemName="Initial Content Pack"
        confirmText="Proceed & Seed"
        cancelText="Cancel"
        onConfirm={handleConfirmSeed}
        onCancel={() => setIsSeedModalOpen(false)}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminDashboard;
