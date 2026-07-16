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
  AreaChart,
  Area,
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
      <div className="min-h-screen bg-[#070114] flex flex-col items-center justify-center gap-4 text-white">
        <Loading />
        <p className="font-black uppercase tracking-widest text-indigo-400 animate-pulse">Synchronizing Cosmos...</p>
      </div>
    );
  }

  // Fallback if leaderboard is disabled
  if (isVisible === false) {
    return (
      <div className="min-h-screen bg-[#060112] text-white flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Glowing background highlights */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-md w-full bg-slate-950/70 backdrop-blur-xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] rounded-2xl p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-red-950/40 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <EyeOff className="w-10 h-10 text-red-400 animate-pulse" />
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
            className="mt-8 w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-black py-4 uppercase rounded-xl border border-red-400/30 transition-all shadow-lg hover:shadow-red-500/20"
          >
            Return to Headquarters
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

  // Podium positioning mapping [2nd, 1st, 3rd]
  const podiumLayout = [];
  if (podium[1]) podiumLayout.push({ item: podium[1], rank: 2 });
  if (podium[0]) podiumLayout.push({ item: podium[0], rank: 1 });
  if (podium[2]) podiumLayout.push({ item: podium[2], rank: 3 });

  const finalPodiumLayout = podium.length === 1 
    ? [{ item: podium[0], rank: 1 }]
    : podium.length === 2
    ? [{ item: podium[1], rank: 2 }, { item: podium[0], rank: 1 }]
    : podiumLayout;

  // Chart Data preparation for Recharts
  const barChartData = filteredPromoters.slice(0, 10).map(p => ({
    name: p.name.split(' ')[0].toUpperCase(),
    'Website Auto': p.siteReferrals || 0,
    'Google Form Manual': p.gformReferrals || 0,
    'Total Referrals': p.totalReferrals || 0
  }));

  const pieChartData = [
    { name: 'Website Registrations', value: totalSite, color: '#00FFFF' },
    { name: 'Google Form Entries', value: totalGForm, color: '#FF00FF' }
  ].filter(d => d.value > 0); // only show if there are records

  // Fallback if pie chart data is empty
  const hasChartData = totalReferrals > 0;

  return (
    <div className="min-h-screen bg-[#060112] text-white font-sans relative overflow-hidden selection:bg-[#FF00FF] selection:text-white">
      {/* Mesh Glow Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-purple-900/30 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-950/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[25%] w-[40%] h-[40%] rounded-full bg-pink-950/15 blur-[130px] pointer-events-none"></div>
      
      {/* Scanline pattern overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-20"></div>

      <div className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        
        {/* Navigation Back Link */}
        <div>
          <button
            onClick={() => onNavigate && onNavigate('/')}
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-white font-black uppercase text-xs tracking-wider transition-colors bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-4 py-2 hover:border-indigo-400/50"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Website
          </button>
        </div>

        {/* Dynamic Glowing Header */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00FFFF]/30 bg-[#00FFFF]/10 text-[#00FFFF] font-black uppercase text-xs rounded-full shadow-[0_0_15px_rgba(0,255,255,0.15)]">
            <Sparkles className="w-4 h-4 animate-spin-slow" /> IEDC PROMOTION HUB
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFDE03] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            REFERRAL COSMOS
          </h1>
          <p className="max-w-2xl mx-auto text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Real-time standings and visual analytics for the event promotion campaign.
          </p>
        </div>

        {/* Cosmic Metrics dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex items-center gap-5 hover:border-indigo-400/40 transition-colors">
            <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-xl text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Flame className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Campaign Referrals</div>
              <div className="text-3xl font-black uppercase text-white tracking-tight">{totalReferrals}</div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex items-center gap-5 hover:border-indigo-400/40 transition-colors">
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-[#00FFFF] shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Active Campaigners</div>
              <div className="text-3xl font-black uppercase text-white tracking-tight">{totalPromoters}</div>
            </div>
          </div>

          <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex items-center gap-5 hover:border-indigo-400/40 transition-colors">
            <div className="p-4 bg-pink-950/40 border border-pink-500/30 rounded-xl text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Leading Star</div>
              <div className="text-lg font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 truncate max-w-[200px]" title={topPerformerName}>
                {topPerformerName}
              </div>
            </div>
          </div>
        </div>

        {/* Podium section for top 3 */}
        {podium.length > 0 && (
          <div className="bg-slate-950/50 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 md:p-10 space-y-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center gap-2 justify-center tracking-wider">
              <Award className="w-6 h-6 text-yellow-400" /> Champions Podium
            </h2>
            
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-10 pb-6">
              {finalPodiumLayout.map(({ item, rank }) => {
                const styles = {
                  1: { 
                    bg: 'bg-gradient-to-b from-yellow-500/20 via-yellow-600/10 to-transparent', 
                    border: 'border-yellow-400/50', 
                    height: 'h-64 md:h-72', 
                    shadow: 'shadow-[0_0_40px_rgba(234,179,8,0.15)]',
                    accentText: 'text-yellow-400',
                    badgeBg: 'bg-yellow-400 text-black'
                  },
                  2: { 
                    bg: 'bg-gradient-to-b from-slate-400/20 via-slate-500/10 to-transparent', 
                    border: 'border-slate-400/50', 
                    height: 'h-48 md:h-56', 
                    shadow: 'shadow-[0_0_30px_rgba(148,163,184,0.1)]',
                    accentText: 'text-slate-300',
                    badgeBg: 'bg-slate-300 text-black'
                  },
                  3: { 
                    bg: 'bg-gradient-to-b from-amber-700/25 via-amber-800/10 to-transparent', 
                    border: 'border-amber-600/50', 
                    height: 'h-36 md:h-44', 
                    shadow: 'shadow-[0_0_20px_rgba(180,83,9,0.08)]',
                    accentText: 'text-amber-500',
                    badgeBg: 'bg-amber-600 text-white'
                  }
                }[rank as 1 | 2 | 3] || { bg: 'bg-slate-900', border: 'border-slate-800', height: 'h-32', shadow: '', accentText: 'text-white', badgeBg: 'bg-white text-black' };

                return (
                  <div key={item.id} className="flex flex-col items-center w-full md:w-56">
                    {/* Floating crown for Gold medalist */}
                    {rank === 1 && (
                      <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400/30 animate-bounce mb-2" />
                    )}
                    
                    {/* Glassmorphic Podium Pillar */}
                    <div className={`w-full ${styles.bg} ${styles.border} ${styles.shadow} border-[2px] backdrop-blur-md flex flex-col justify-between items-center p-6 text-center ${styles.height} rounded-t-2xl relative overflow-hidden group`}>
                      <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="space-y-1 relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm mx-auto shadow-md ${styles.badgeBg}`}>
                          {rank}
                        </div>
                        <div className="font-black text-sm md:text-base uppercase tracking-wider text-white line-clamp-2 max-h-12 leading-tight pt-3">
                          {item.name}
                        </div>
                      </div>
                      
                      <div className="space-y-1 relative z-10">
                        <div className={`text-4xl font-black tracking-tighter ${styles.accentText} filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]`}>
                          {item.totalReferrals}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-950/40 px-2.5 py-1 rounded-md border border-white/5">
                          REFERRALS
                        </div>
                      </div>
                    </div>
                    {/* Glowing bottom footer containing referral code */}
                    <div className="w-full bg-slate-950 border-x-2 border-b-2 border-indigo-500/10 rounded-b-2xl py-2 px-3 text-center">
                      <code className="text-[9px] font-black tracking-widest text-[#00FFFF] uppercase">{item.code}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visual Charts and Analytics Section */}
        {hasChartData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Standing Graph (Bar Chart) */}
            <div className="lg:col-span-2 p-6 bg-slate-950/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-4 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#00FFFF]" />
                <h3 className="text-lg font-black uppercase tracking-wider">Top 10 Campaign Analytics</h3>
              </div>
              <div className="h-80 w-full text-slate-300 font-semibold text-xs mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#070114', borderColor: '#334155', borderRadius: '12px' }} 
                      labelStyle={{ color: '#00FFFF', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="Website Auto" fill="#00FFFF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Google Form Manual" fill="#FF00FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Graph (Pie Chart) */}
            <div className="lg:col-span-1 p-6 bg-slate-950/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-4 mb-4 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[#FF00FF]" />
                <h3 className="text-lg font-black uppercase tracking-wider">Source Distribution</h3>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#070114', borderColor: '#334155', borderRadius: '12px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend split list */}
              <div className="space-y-2 mt-4 text-xs">
                {pieChartData.map((d, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="font-bold text-slate-400 uppercase">{d.name}</span>
                    </div>
                    <span className="font-black text-white text-sm">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
            <BarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-black uppercase text-slate-500 tracking-wider">Analytics charts will display here once registrations begin.</p>
          </div>
        )}

        {/* Dynamic Standing Table */}
        <div className="p-6 md:p-8 bg-slate-950/50 backdrop-blur-xl border border-indigo-500/20 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider">Standing Roster</h3>
            
            {/* Live Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search name or referral code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-indigo-500/20 rounded-xl bg-slate-900/60 text-white font-bold outline-none focus:border-[#FF00FF] transition-all placeholder-slate-500"
              />
              <Search className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
            </div>
          </div>

          {filteredPromoters.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-black uppercase text-slate-500 text-lg">No matches discovered</p>
              <p className="text-xs text-slate-600 font-bold uppercase mt-1">Refine your keyword queries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse mt-6">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <th className="pb-3 w-16 text-center">Rank</th>
                    <th className="pb-3 px-4">Campaigner</th>
                    <th className="pb-3 px-4">Code</th>
                    <th className="pb-3 px-4 text-center">Website referrals</th>
                    <th className="pb-3 px-4 text-center">GForm referrals</th>
                    <th className="pb-3 text-right">Referral Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredPromoters.map((promoter, index) => {
                    const rank = index + 1;
                    
                    let rankBg = 'bg-slate-900 border border-slate-800 text-slate-400';
                    if (rank === 1) rankBg = 'bg-yellow-400 text-black border border-yellow-500 font-black shadow-[0_0_10px_rgba(234,179,8,0.2)]';
                    else if (rank === 2) rankBg = 'bg-slate-300 text-black border border-slate-400 font-black';
                    else if (rank === 3) rankBg = 'bg-amber-600 text-white border border-amber-700 font-black';

                    return (
                      <tr key={promoter.id} className="font-bold text-slate-300 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${rankBg}`}>
                            {rank}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-black uppercase text-white text-sm">
                          {promoter.name}
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-slate-900 border border-slate-850 px-3 py-1 rounded text-xs font-black text-pink-400 uppercase tracking-widest">
                            {promoter.code}
                          </code>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-500">
                          {promoter.siteReferrals || 0}
                        </td>
                        <td className="py-4 px-4 text-center text-slate-500">
                          {promoter.gformReferrals || 0}
                        </td>
                        <td className="py-4 text-right text-lg font-black text-white">
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
