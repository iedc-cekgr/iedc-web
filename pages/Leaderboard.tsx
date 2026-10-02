import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Promoter } from '../types';
import { Trophy, Search, Sparkles, EyeOff, Award, Crown, User, Flame, BarChart2, PieChart as PieIcon, ArrowLeft } from 'lucide-react';
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
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const settingsRef = doc(db, 'config', 'leaderboard_settings');
        const settingsSnap = await getDoc(settingsRef);
        
        let visible = false;
        if (settingsSnap.exists()) {
          visible = settingsSnap.data().isVisible || false;
        }
        setIsVisible(visible);

        if (visible) {
          const querySnapshot = await getDocs(collection(db, 'promoters'));
          const list: Promoter[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<Promoter, 'id'>;
            if (data.isActive) {
              list.push({ id: doc.id, ...data });
            }
          });
          // Sort by totalReferrals desc, then by name
          list.sort((a, b) => {
            if (b.totalReferrals !== a.totalReferrals) {
              return b.totalReferrals - a.totalReferrals;
            }
            return a.name.localeCompare(b.name);
          });
          setPromoters(list);
        }
      } catch (err) {
        console.error("Error loading leaderboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-white">
        <Loading />
        <p className="font-black uppercase tracking-widest text-[#f5c211] animate-pulse">Loading Leaderboard...</p>
      </div>
    );
  }

  // Fallback if leaderboard is disabled
  if (isVisible === false) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#f5c211]/10 blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-md w-full bg-[#111115] backdrop-blur-xl border border-[#f5c211]/30 shadow-[0_0_50px_rgba(245,194,17,0.1)] rounded-2xl p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-[#16161c] border border-[#f5c211]/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(245,194,17,0.2)]">
            <EyeOff className="w-10 h-10 text-[#f5c211] animate-pulse" />
          </div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">Leaderboard Offline</h2>
          <p className="mt-4 text-slate-400 font-bold uppercase text-xs leading-relaxed">
            The event referral leaderboard has been hidden by administrators.
          </p>
          <p className="mt-2 text-slate-500 text-[10px] font-black uppercase">
            We will publish standings shortly. Stay tuned!
          </p>
          <button
            onClick={() => onNavigate && onNavigate('/')}
            className="mt-8 w-full bg-[#f5c211] hover:bg-[#ffcf25] text-black font-black py-3.5 uppercase rounded-xl transition-all shadow-lg shadow-[#f5c211]/20 tracking-wider text-xs"
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

  // Chart Data preparation for Recharts
  const barChartData = filteredPromoters.slice(0, 10).map(p => ({
    name: p.name.split(' ')[0].toUpperCase(),
    'Website Auto': p.siteReferrals || 0,
    'Google Form Manual': p.gformReferrals || 0,
    'Total Referrals': p.totalReferrals || 0
  }));

  const pieChartData = [
    { name: 'Website Registrations', value: totalSite, color: '#f5c211' },
    { name: 'Google Form Entries', value: totalGForm, color: '#ffffff' }
  ].filter(d => d.value > 0);

  const hasChartData = totalReferrals > 0;

  // Render Podium card helper
  const renderPodiumCard = (promoter: Promoter, rank: number) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;

    return (
      <div 
        key={promoter.id || promoter.code}
        className={`bg-[#16161c] rounded-xl overflow-hidden flex flex-col justify-between ${
          isGold 
            ? 'border-2 border-[#f5c211] shadow-[0_0_25px_rgba(245,194,17,0.18)]' 
            : 'border border-white/10 shadow-lg'
        }`}
      >
        <div className="p-6 flex items-center justify-between min-h-[110px]">
          {/* Rank number */}
          <div className={`text-4xl md:text-5xl font-black pr-5 border-r select-none ${
            isGold 
              ? 'text-[#f5c211] border-[#f5c211]/30' 
              : isSilver 
              ? 'text-slate-600 border-slate-700/50' 
              : 'text-amber-700/60 border-slate-700/50'
          }`}>
            {formattedRank}
          </div>

          {/* User detail */}
          <div className="flex-1 pl-5 text-left">
            <h4 className="text-sm md:text-base font-black text-white uppercase tracking-wide truncate max-w-[170px]" title={promoter.name}>
              {promoter.name}
            </h4>
            <div className="mt-2">
              <span className="text-2xl md:text-3xl font-black text-white leading-none block">
                {promoter.totalReferrals || 0}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                REFERRALS
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Banner Strip */}
        <div className={`py-1.5 px-4 text-right ${
          isGold
            ? 'bg-[#f5c211] text-black font-black'
            : isSilver
            ? 'bg-gradient-to-r from-slate-700/50 via-slate-600/30 to-slate-800/80 text-slate-300 border-t border-slate-700/40 font-bold'
            : 'bg-gradient-to-r from-amber-950/60 via-amber-800/40 to-amber-900/60 text-amber-200/90 border-t border-amber-800/30 font-bold'
        }`}>
          <code className="text-[10px] font-mono tracking-widest uppercase">{promoter.code}</code>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans relative overflow-hidden selection:bg-[#f5c211] selection:text-black">
      {/* Golden Radial Glow Overlay (Left) */}
      <div className="absolute top-[-10%] left-[-15%] w-[55%] h-[55%] rounded-full bg-[#f5c211]/10 blur-[130px] pointer-events-none"></div>

      {/* Decorative Geometric Angled Lines (Top Right with Smooth Gradient Mask) */}
      <div 
        className="absolute top-0 right-0 w-full h-[650px] pointer-events-none opacity-15"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, #f5c211, #f5c211 1px, transparent 1px, transparent 18px)`,
          WebkitMaskImage: `radial-gradient(ellipse at top right, rgba(0,0,0,1) 10%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 80%)`,
          maskImage: `radial-gradient(ellipse at top right, rgba(0,0,0,1) 10%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 80%)`
        }}
      ></div>

      <div className="relative z-10 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Center Hub Tag */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => onNavigate && onNavigate('/')}
            className="inline-flex items-center gap-2 border border-[#f5c211]/80 hover:bg-[#f5c211]/10 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#f5c211]" /> Return to Website
          </button>

          <div className="inline-flex items-center gap-2 border border-[#f5c211]/50 bg-[#121216] text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(245,194,17,0.1)]">
            <span className="w-2 h-2 rounded-full bg-[#f5c211] shadow-[0_0_8px_#f5c211] animate-pulse"></span>
            IEDC PROMOTION HUB
          </div>
          
          <div className="hidden sm:block w-36"></div>
        </div>

        {/* Main Title */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight">
            <span className="text-white">REFERRAL </span>
            <span className="text-[#f5c211]">RANK</span>
          </h1>
          <p className="text-slate-400 font-semibold text-xs md:text-sm uppercase tracking-[0.2em]">
            REAL-TIME REFERRAL LEADERBOARD &amp; CAMPAIGN STANDINGS
          </p>
        </div>

        {/* Top 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#121216] border border-white/10 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-1.5 h-8 bg-[#f5c211] rounded-full"></div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Campaign Referrals</div>
              <div className="text-3xl font-black text-white mt-0.5">{totalReferrals}</div>
            </div>
          </div>

          <div className="bg-[#121216] border border-white/10 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-1.5 h-8 bg-[#f5c211] rounded-full"></div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campaigners</div>
              <div className="text-3xl font-black text-white mt-0.5">{totalPromoters}</div>
            </div>
          </div>

          <div className="bg-[#121216] border border-white/10 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-1.5 h-8 bg-[#f5c211] rounded-full"></div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leading Star</div>
              <div className="text-xl font-black text-[#f5c211] uppercase tracking-wider truncate mt-0.5" title={topPerformerName}>
                {topPerformerName}
              </div>
            </div>
          </div>
        </div>

        {/* CHAMPIONS PODIUM Container */}
        <div className="bg-[#111115]/90 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-white">
              CHAMPIONS PODIUM
            </h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              <span>TOP 3 CAMPAIGNERS</span>
              <span className="w-6 h-[2px] bg-[#f5c211] inline-block"></span>
            </div>
          </div>

          {podium.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Rank 02 (Left) */}
              {podium[1] ? (
                renderPodiumCard(podium[1], 2)
              ) : (
                <div className="bg-[#16161c]/40 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs font-bold uppercase flex items-center justify-center min-h-[110px]">
                  Slot 02 Open
                </div>
              )}

              {/* Rank 01 (Center - Gold) */}
              {podium[0] ? (
                renderPodiumCard(podium[0], 1)
              ) : (
                <div className="bg-[#16161c]/40 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs font-bold uppercase flex items-center justify-center min-h-[110px]">
                  Slot 01 Open
                </div>
              )}

              {/* Rank 03 (Right) */}
              {podium[2] ? (
                renderPodiumCard(podium[2], 3)
              ) : (
                <div className="bg-[#16161c]/40 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs font-bold uppercase flex items-center justify-center min-h-[110px]">
                  Slot 03 Open
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 font-bold text-xs uppercase">
              No campaigners on podium yet.
            </div>
          )}
        </div>

        {/* Visual Analytics section (If data exists) */}
        {hasChartData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 bg-[#111115]/90 border border-white/10 rounded-2xl shadow-xl">
              <div className="border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#f5c211]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Top Campaigners Analytics</h3>
              </div>
              <div className="h-64 w-full text-slate-300 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#26262e" />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121216', borderColor: '#f5c211', borderRadius: '8px' }} 
                      labelStyle={{ color: '#f5c211', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="Website Auto" fill="#f5c211" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Google Form Manual" fill="#ffffff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-1 p-6 bg-[#111115]/90 border border-white/10 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#f5c211]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Source Breakdown</h3>
              </div>
              <div className="h-48 w-full flex items-center justify-center">
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121216', borderColor: '#f5c211', borderRadius: '8px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2 text-xs">
                {pieChartData.map((d, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="font-bold text-slate-400 uppercase">{d.name}</span>
                    </div>
                    <span className="font-black text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STANDING ROSTER Table Container */}
        <div className="bg-[#111115]/90 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider">
              <span className="text-white">STANDING </span>
              <span className="text-[#f5c211]">ROSTER</span>
            </h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search name or referral code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-white/10 rounded-lg bg-[#181820] text-white text-xs font-semibold outline-none focus:border-[#f5c211] transition-all placeholder-slate-500"
              />
              <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
            </div>
          </div>

          {filteredPromoters.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-black uppercase text-slate-500 text-sm">No match found</p>
              <p className="text-xs text-slate-600 font-semibold uppercase mt-1">Try another search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="pb-3 w-16 text-left">RANK</th>
                    <th className="pb-3 px-4">CAMPAIGNER</th>
                    <th className="pb-3 px-4">CODE</th>
                    <th className="pb-3 px-4 text-center">WEBSITE REFERRALS</th>
                    <th className="pb-3 px-4 text-center">GFORM REFERRALS</th>
                    <th className="pb-3 text-right">TOTAL REFERRALS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPromoters.map((promoter, index) => {
                    const rank = index + 1;
                    const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;

                    return (
                      <tr key={promoter.id || promoter.code} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 text-left font-black text-sm text-[#f5c211]">
                          {formattedRank}
                        </td>
                        <td className="py-4 px-4 font-bold uppercase text-white text-sm">
                          {promoter.name}
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-[#181820] border border-slate-700/60 text-slate-300 text-xs font-mono font-bold px-3 py-1 rounded-md inline-block uppercase">
                            {promoter.code}
                          </code>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-400 font-semibold text-xs">
                          {promoter.siteReferrals || 0}
                        </td>
                        <td className="py-4 px-4 text-center text-slate-400 font-semibold text-xs">
                          {promoter.gformReferrals || 0}
                        </td>
                        <td className="py-4 text-right text-base font-black text-[#f5c211]">
                          {promoter.totalReferrals || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

