import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { Promoter } from '../types';
import { Trophy, Search, EyeOff, Crown, User, BarChart2, PieChart as PieIcon, Calendar, AlertCircle } from 'lucide-react';
import Loading from '../components/Loading';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  CartesianGrid
} from 'recharts';

interface Props {
  onNavigate?: (path: string) => void;
}

const Leaderboard: React.FC<Props> = ({ onNavigate }) => {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventStats, setEventStats] = useState<Record<string, { site: number; gform: number }>>({});

  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isVisible) {
      fetchStandingsForSelection();
    }
  }, [selectedEventId, isVisible]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch visibility settings
      const settingsRef = doc(db, 'config', 'leaderboard_settings');
      const settingsSnap = await getDoc(settingsRef);
      
      let visible = false;
      if (settingsSnap.exists()) {
        visible = settingsSnap.data().isVisible || false;
      }
      setIsVisible(visible);

      if (visible) {
        // 2. Fetch all events for event-based selector
        const eventsSnap = await getDocs(collection(db, 'events'));
        const eventsList: any[] = [];
        eventsSnap.forEach((doc) => {
          eventsList.push({ docId: doc.id, ...doc.data() });
        });
        eventsList.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
        setEvents(eventsList);

        // Fetch standings
        await fetchStandingsForSelection();
      }
    } catch (err) {
      console.error("Error loading leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandingsForSelection = async () => {
    try {
      // Fetch all active promoters (allow true or undefined, only exclude explicitly false)
      const promotersSnap = await getDocs(collection(db, 'promoters'));
      const list: Promoter[] = [];
      promotersSnap.forEach((doc) => {
        const data = doc.data() as Omit<Promoter, 'id'>;
        if (data.isActive !== false) {
          list.push({
            id: doc.id,
            ...data,
            siteReferrals: data.siteReferrals || 0,
            gformReferrals: data.gformReferrals || 0,
            totalReferrals: data.totalReferrals !== undefined ? data.totalReferrals : ((data.siteReferrals || 0) + (data.gformReferrals || 0))
          });
        }
      });

      const statsMap: Record<string, { site: number; gform: number }> = {};

      if (selectedEventId) {
        // Event-specific mode: fetch event_referrals for selected event
        const referralsRef = collection(db, 'event_referrals');
        const q = query(referralsRef, where('eventId', '==', selectedEventId));
        const referralsSnap = await getDocs(q);

        referralsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.promoterId) {
            statsMap[data.promoterId] = {
              site: data.siteReferrals || 0,
              gform: data.gformReferrals || 0
            };
          }
        });

        // Compute total per promoter for selected event
        list.forEach((p) => {
          const stats = statsMap[p.id!] || { site: 0, gform: 0 };
          p.siteReferrals = stats.site;
          p.gformReferrals = stats.gform;
          p.totalReferrals = stats.site + stats.gform;
        });

        setEventStats(statsMap);
      } else {
        // "All Events" mode: aggregate all event_referrals if global document total is 0
        try {
          const referralsSnap = await getDocs(collection(db, 'event_referrals'));
          const allEventStatsMap: Record<string, { site: number; gform: number }> = {};
          
          referralsSnap.forEach((doc) => {
            const data = doc.data();
            if (data.promoterId) {
              if (!allEventStatsMap[data.promoterId]) {
                allEventStatsMap[data.promoterId] = { site: 0, gform: 0 };
              }
              allEventStatsMap[data.promoterId].site += (data.siteReferrals || 0);
              allEventStatsMap[data.promoterId].gform += (data.gformReferrals || 0);
            }
          });

          list.forEach((p) => {
            const evStats = allEventStatsMap[p.id!];
            if (evStats) {
              const computedSite = evStats.site;
              const computedGForm = evStats.gform;
              const computedTotal = computedSite + computedGForm;

              p.siteReferrals = Math.max(p.siteReferrals || 0, computedSite);
              p.gformReferrals = Math.max(p.gformReferrals || 0, computedGForm);
              p.totalReferrals = Math.max(p.totalReferrals || 0, computedTotal);
            }
          });
        } catch (e) {
          console.error("Error aggregating event referrals:", e);
        }
      }

      // Sort by totalReferrals desc, then by name
      list.sort((a, b) => {
        const bTotal = b.totalReferrals || 0;
        const aTotal = a.totalReferrals || 0;
        if (bTotal !== aTotal) {
          return bTotal - aTotal;
        }
        return a.name.localeCompare(b.name);
      });

      setPromoters(list);
    } catch (err) {
      console.error("Error fetching standings:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-black dark:text-white pt-20">
        <Loading />
        <p className="font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 text-sm animate-pulse">Loading Leaderboard...</p>
      </div>
    );
  }

  // Fallback if leaderboard is disabled
  if (isVisible === false) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto text-center space-y-6">
        <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 bg-[#FFDE03] border-[3px] border-black rounded-full flex items-center justify-center mx-auto text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <EyeOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black uppercase text-black dark:text-white tracking-tight">Leaderboard Offline</h2>
          <p className="text-slate-600 dark:text-slate-300 font-bold uppercase text-xs leading-relaxed">
            The event referral leaderboard has been hidden by administrators.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
            We will publish standings shortly. Stay tuned!
          </p>
          <button
            onClick={() => onNavigate && onNavigate('/')}
            className="mt-4 w-full bg-[#FFDE03] hover:bg-[#ffe633] text-black border-[3px] border-black font-black py-3.5 uppercase rounded-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] tracking-wider text-xs"
          >
            Return to Website
          </button>
        </div>
      </div>
    );
  }

  const filteredPromoters = promoters.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const podium = filteredPromoters.slice(0, 3);
  
  // Stats calculations
  const totalReferrals = promoters.reduce((sum, p) => sum + (p.totalReferrals || 0), 0);
  const totalSite = promoters.reduce((sum, p) => sum + (p.siteReferrals || 0), 0);
  const totalGForm = promoters.reduce((sum, p) => sum + (p.gformReferrals || 0), 0);
  const totalPromoters = promoters.length;
  const topPerformerName = promoters[0]?.name || 'N/A';

  const selectedEventObj = selectedEventId ? events.find(e => e.docId === selectedEventId) : null;
  const selectedEventTitle = selectedEventObj ? selectedEventObj.title : 'All Events Overall Standings';

  // Determine if referral tracking is active/used for the selected event
  const hasEventReferrals = Boolean(
    selectedEventId &&
    Object.keys(eventStats).length > 0 &&
    Object.values(eventStats).some(s => (s.site || 0) + (s.gform || 0) > 0)
  );

  const isYIEvent = Boolean(
    selectedEventObj &&
    selectedEventObj.title &&
    /\b(yi|yip|youth|young)\b/i.test(selectedEventObj.title)
  );

  const isReferralActiveForEvent = selectedEventId ? (
    selectedEventObj?.enableReferralCode === true ||
    hasEventReferrals ||
    isYIEvent
  ) : true;

  const isReferralDisabledForEvent = selectedEventId ? !isReferralActiveForEvent : false;

  // Determine Column Visibility for Event Type
  let showWebsiteCol = true;
  let showGFormCol = true;

  if (selectedEventId) {
    if (selectedEventObj?.eventType === 'google-form') {
      showGFormCol = true;
      showWebsiteCol = totalSite > 0;
    } else if (selectedEventObj?.eventType === 'website-form') {
      showWebsiteCol = true;
      showGFormCol = totalGForm > 0;
    } else {
      if (totalSite === 0 && totalGForm > 0) {
        showWebsiteCol = false;
        showGFormCol = true;
      } else if (totalGForm === 0 && totalSite > 0) {
        showWebsiteCol = true;
        showGFormCol = false;
      }
    }
  }

  // Chart Data preparation for Recharts
  const barChartData = filteredPromoters.slice(0, 10).map(p => {
    const item: any = { name: p.name.split(' ')[0].toUpperCase() };
    if (showWebsiteCol) item['Website Auto'] = p.siteReferrals || 0;
    if (showGFormCol) item['Google Form Manual'] = p.gformReferrals || 0;
    item['Total Referrals'] = p.totalReferrals || 0;
    return item;
  });

  const pieChartData = [
    showWebsiteCol ? { name: 'Website Registrations', value: totalSite, color: '#FFDE03' } : null,
    showGFormCol ? { name: 'Google Form Entries', value: totalGForm, color: '#00FFFF' } : null
  ].filter((d): d is { name: string; value: number; color: string } => d !== null && d.value > 0);

  const hasChartData = totalReferrals > 0;

  // Render Podium card helper
  const renderPodiumCard = (promoter: Promoter, rank: number) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;
    const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;

    const bgStyle = isGold
      ? 'bg-[#FFDE03] text-black border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]'
      : isSilver
      ? 'bg-white dark:bg-slate-900 text-black dark:text-white border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]'
      : 'bg-white dark:bg-slate-900 text-black dark:text-white border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]';

    const badgeColor = isGold
      ? 'bg-black text-[#FFDE03]'
      : isSilver
      ? 'bg-[#00FFFF] text-black border border-black font-black'
      : 'bg-[#FF00FF] text-white border border-black font-black';

    const badgeText = isGold ? 'CHAMPION' : isSilver ? 'RUNNER-UP' : '3RD PLACE';

    return (
      <div 
        key={promoter.id || promoter.code}
        className={`${bgStyle} rounded-2xl overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-1 h-full`}
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className={`px-3 py-1 rounded-md font-black text-[10px] uppercase tracking-wider ${badgeColor} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
              {badgeText}
            </span>
            <div className={`text-3xl sm:text-4xl font-black ${isGold ? 'text-black' : 'text-slate-400 dark:text-slate-500'}`}>
              #{formattedRank}
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-black uppercase tracking-tight truncate" title={promoter.name}>
              {promoter.name}
            </h4>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black leading-none">
                {promoter.totalReferrals || 0}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                REFERRALS
              </span>
            </div>
          </div>
        </div>

        <div className={`py-2.5 px-5 flex items-center justify-between border-t-[2px] ${isGold ? 'border-black bg-black/10' : 'border-black/20 dark:border-white/20 bg-slate-100 dark:bg-slate-800'}`}>
          <span className="text-[10px] font-black uppercase opacity-70">CODE</span>
          <code className={`text-xs font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded ${isGold ? 'bg-black text-[#FFDE03]' : 'bg-black text-white dark:bg-white dark:text-black'}`}>
            {promoter.code}
          </code>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-28 md:pt-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="border-l-[8px] md:border-l-[12px] border-black dark:border-white pl-4 md:pl-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#FFDE03] text-black border-[2px] md:border-[3px] border-black px-3.5 py-1 rounded-lg font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Trophy size={15} className="text-black" />
            <span>IEDC PROMOTION HUB</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">
            REFERRAL <span className="bg-[#FFDE03] px-2 text-black border-x-[4px] border-black">LEADERBOARD</span>
          </h1>
          <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed uppercase">
            Real-time referral standings &amp; campaign performance for IEDC events.
          </p>
        </div>
      </div>

      {/* Event Selection Dropdown Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="p-3 bg-[#00FFFF] border-[2px] border-black rounded-xl text-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">LEADERBOARD SCOPE</span>
            <span className="text-sm sm:text-base font-black text-black dark:text-white uppercase tracking-wide leading-tight">
              {selectedEventTitle}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 shrink-0 hidden md:inline-block">SELECT EVENT:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full sm:w-80 p-3 bg-slate-50 dark:bg-slate-800 border-[2px] border-black dark:border-white rounded-xl text-black dark:text-white font-extrabold text-xs uppercase outline-none focus:ring-2 focus:ring-[#FFDE03] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all"
          >
            <option value="">ALL EVENTS (OVERALL COMBINED STANDINGS)</option>
            {events.map((e) => (
              <option key={e.docId} value={e.docId}>
                {e.title.toUpperCase()} ({e.date || 'NO DATE'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice when referral system is not enabled for selected event */}
      {isReferralDisabledForEvent ? (
        <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-8 text-center space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <div className="w-16 h-16 bg-[#FFDE03] border-[3px] border-black rounded-full flex items-center justify-center mx-auto text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase text-black dark:text-white tracking-wide">
            REFERRAL SYSTEM NOT ACTIVE FOR THIS EVENT
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold uppercase max-w-lg mx-auto leading-relaxed">
            "{selectedEventTitle}" does not utilize promoter referral codes or campaigner standings. Select another event from the dropdown above to view standings.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] flex items-center gap-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-[#FFDE03] border-[2.5px] border-black rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {selectedEventId ? 'EVENT REFERRALS' : 'TOTAL REFERRALS'}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black dark:text-white mt-0.5">{totalReferrals}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] flex items-center gap-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-[#00FFFF] border-[2.5px] border-black rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">ACTIVE CAMPAIGNERS</div>
                <div className="text-2xl sm:text-3xl font-black text-black dark:text-white mt-0.5">{totalPromoters}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] flex items-center gap-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-[#FF00FF] border-[2.5px] border-black rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white">
                <Crown className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOP PERFORMER</div>
                <div className="text-lg sm:text-xl font-black text-black dark:text-white uppercase tracking-wider truncate mt-0.5" title={topPerformerName}>
                  {topPerformerName}
                </div>
              </div>
            </div>
          </div>

          {/* CHAMPIONS PODIUM Container */}
          <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-[2px] border-black/10 dark:border-white/10 pb-4">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white">
                CHAMPIONS PODIUM {selectedEventId ? `- ${selectedEventTitle}` : ''}
              </h3>
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>TOP 3 CAMPAIGNERS</span>
                <span className="w-6 h-[3px] bg-[#FFDE03] inline-block border border-black"></span>
              </div>
            </div>

            {podium.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Rank 02 (Silver) */}
                <div className="order-2 md:order-1">
                  {podium[1] ? (
                    renderPodiumCard(podium[1], 2)
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800 border-[3px] border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-400 font-black text-xs uppercase flex items-center justify-center min-h-[160px]">
                      Slot 02 Open
                    </div>
                  )}
                </div>

                {/* Rank 01 (Gold - Champion) */}
                <div className="order-1 md:order-2 md:-mt-4">
                  {podium[0] ? (
                    renderPodiumCard(podium[0], 1)
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800 border-[3px] border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-400 font-black text-xs uppercase flex items-center justify-center min-h-[160px]">
                      Slot 01 Open
                    </div>
                  )}
                </div>

                {/* Rank 03 (Bronze) */}
                <div className="order-3 md:order-3">
                  {podium[2] ? (
                    renderPodiumCard(podium[2], 3)
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800 border-[3px] border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-400 font-black text-xs uppercase flex items-center justify-center min-h-[160px]">
                      Slot 03 Open
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 font-bold text-xs uppercase">
                No campaigners on podium yet for this selection.
              </div>
            )}
          </div>

          {/* Visual Analytics section (If data exists) */}
          {hasChartData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <div className="border-b-[2px] border-black/10 dark:border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-black dark:text-white" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">TOP CAMPAIGNERS ANALYTICS</h3>
                </div>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#64748b" tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#FFDE03', border: '2px solid #000', borderRadius: '8px', color: '#fff' }} 
                        labelStyle={{ color: '#FFDE03', fontWeight: 'bold' }}
                      />
                      <Legend iconType="square" />
                      {showWebsiteCol && <Bar dataKey="Website Auto" fill="#FFDE03" stroke="#000" strokeWidth={1} radius={[4, 4, 0, 0]} />}
                      {showGFormCol && <Bar dataKey="Google Form Manual" fill="#00FFFF" stroke="#000" strokeWidth={1} radius={[4, 4, 0, 0]} />}
                      {!showWebsiteCol && !showGFormCol && <Bar dataKey="Total Referrals" fill="#FFDE03" stroke="#000" strokeWidth={1} radius={[4, 4, 0, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-1 p-6 bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
                <div className="border-b-[2px] border-black/10 dark:border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-black dark:text-white" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">SOURCE BREAKDOWN</h3>
                </div>
                <div className="h-48 w-full flex items-center justify-center">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#FFDE03' : '#00FFFF'} stroke="#000" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#FFDE03', border: '2px solid #000', borderRadius: '8px', color: '#fff' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 uppercase">
                      No source data
                    </div>
                  )}
                </div>
                <div className="space-y-2 mt-2 text-xs">
                  {pieChartData.map((d, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 border border-black rounded-sm" style={{ backgroundColor: index === 0 ? '#FFDE03' : '#00FFFF' }}></span>
                        <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">{d.name}</span>
                      </div>
                      <span className="font-black text-black dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STANDING ROSTER Table Container */}
          <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white rounded-2xl p-4 sm:p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-[2px] border-black/10 dark:border-white/10 pb-4">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white">
                STANDING <span className="bg-[#FFDE03] px-2 text-black border-x-[3px] border-black">ROSTER</span>
              </h3>
              
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-[2px] border-black dark:border-white rounded-xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-[#FFDE03] transition-all placeholder-slate-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] uppercase"
                />
                <Search className="absolute left-3 top-3 text-black dark:text-white w-4 h-4" />
              </div>
            </div>

            {filteredPromoters.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-black uppercase text-slate-500 dark:text-slate-400 text-sm">NO MATCH FOUND</p>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Try another search term or event selection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b-[2px] border-black dark:border-white text-slate-700 dark:text-slate-300 uppercase text-xs font-black tracking-wider">
                      <th className="py-3 px-3 w-16 text-left">RANK</th>
                      <th className="py-3 px-4">CAMPAIGNER</th>
                      <th className="py-3 px-4">CODE</th>
                      {showWebsiteCol && <th className="py-3 px-4 text-center">WEBSITE REFERRALS</th>}
                      {showGFormCol && <th className="py-3 px-4 text-center">GFORM REFERRALS</th>}
                      <th className="py-3 px-4 text-right">TOTAL REFERRALS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredPromoters.map((promoter, index) => {
                      const rank = index + 1;
                      const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;
                      const isTop3 = rank <= 3;

                      return (
                        <tr key={promoter.id || promoter.code} className="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-4 px-3 text-left font-black text-sm">
                            <span className={`inline-block px-2 py-0.5 rounded ${isTop3 ? 'bg-[#FFDE03] text-black border border-black font-black' : 'text-slate-600 dark:text-slate-400'}`}>
                              #{formattedRank}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-black uppercase text-slate-900 dark:text-white text-sm truncate max-w-[180px] sm:max-w-none">
                            {promoter.name}
                          </td>
                          <td className="py-4 px-4">
                            <code className="bg-slate-100 dark:bg-slate-800 border border-black/30 dark:border-white/30 text-black dark:text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md inline-block uppercase">
                              {promoter.code}
                            </code>
                          </td>
                          {showWebsiteCol && (
                            <td className="py-4 px-4 text-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                              {promoter.siteReferrals || 0}
                            </td>
                          )}
                          {showGFormCol && (
                            <td className="py-4 px-4 text-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                              {promoter.gformReferrals || 0}
                            </td>
                          )}
                          <td className="py-4 px-4 text-right font-black text-base text-black dark:text-white">
                            <span className="bg-[#FFDE03] text-black px-3 py-1 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                              {promoter.totalReferrals || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
