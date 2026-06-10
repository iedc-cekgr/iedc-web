import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Lightbulb, Rocket, Zap, Globe, Cpu, ArrowRight } from 'lucide-react';

interface ExultEventData {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  order: number;
}

interface ExultHomeProps {
  onNavigate: (path: string) => void;
}

const ExultHome: React.FC<ExultHomeProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<ExultEventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'exult_events'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExultEventData[];
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching Exult events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden font-sans relative">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        
        .stars-bg {
          background-image: 
            radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 130px 80px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 200px 190px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 250px 20px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 280px 100px, rgba(6,182,212,0.8), rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 300px 300px;
        }

        .pixel-font {
          font-family: 'Share Tech Mono', monospace;
        }

        .glass-card {
          background: rgba(10, 15, 30, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(6, 182, 212, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        @keyframes pulse-glow {
          0% { opacity: 0.5; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
          50% { opacity: 1; box-shadow: 0 0 40px rgba(6, 182, 212, 0.8); }
          100% { opacity: 0.5; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
        }
      `}</style>

      {/* Dynamic Starry Background & Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 stars-bg opacity-70"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px]"></div>
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[150px] -translate-x-1/2"></div>
      </div>

      {/* Floating Abstract 3D/Glass Elements (Simulated with CSS/SVGs) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Left Blue Star */}
        <div className="absolute top-[20%] left-[10%] w-12 h-12 text-blue-400 opacity-80 filter drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
        </div>
        {/* Right Middle Cyan Star */}
        <div className="absolute top-[40%] right-[15%] w-8 h-8 text-cyan-300 opacity-90 filter drop-shadow-[0_0_15px_rgba(103,232,249,0.8)]" style={{ animation: 'float 8s ease-in-out infinite reverse' }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>
        </div>
        {/* Abstract Box Illusion */}
        <div className="absolute bottom-[10%] left-[5%] w-32 h-32 border border-blue-500/30 rounded-lg transform rotate-45 opacity-20 blur-[1px]"></div>
        <div className="absolute top-[10%] right-[5%] w-40 h-40 border-2 border-cyan-500/20 rounded-xl transform -rotate-12 opacity-20 blur-[2px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 pt-20 pb-16 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
            
            <div className="pixel-font text-xl md:text-2xl tracking-widest text-white/90 mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              IEDCCEK 2026 PRESENTS
            </div>

            {/* The EXULT Banner */}
            <div className="relative inline-block mb-10 group">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-40 rounded-3xl group-hover:opacity-60 transition-opacity duration-500"></div>
              
              <div className="relative bg-gradient-to-r from-[#003060] via-[#0077b6] to-[#00b4d8] px-10 py-6 md:px-20 md:py-10 rounded-2xl border-2 border-cyan-300/50" style={{ animation: 'pulse-glow 4s infinite' }}>
                <h1 className="text-6xl md:text-9xl font-black text-white italic tracking-tighter" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}>
                  EXULT 
                  <span className="text-3xl md:text-6xl inline-block transform translate-y-2 md:translate-y-4 ml-2 italic text-cyan-100">
                    2.0
                  </span>
                </h1>
              </div>

              {/* Decorative 3D Cursor */}
              <div className="absolute -bottom-8 -right-8 md:-bottom-12 md:-right-12 text-5xl md:text-7xl transform -rotate-12 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ animation: 'float 5s ease-in-out infinite' }}>
                🖱️
              </div>
            </div>

            <div className="pixel-font text-sm md:text-lg tracking-widest text-cyan-200 mt-4 uppercase border-b border-cyan-500/30 pb-2">
              GET READY TO LIGHT UP YOUR IDEAS
            </div>

            <div className="mt-16 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full px-4">
              {/* Feature Highlights */}
              <div className="glass-card p-6 rounded-xl flex items-start gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 uppercase tracking-wide">Innovation</h3>
                  <p className="text-sm text-slate-400">Transform raw concepts into groundbreaking realities that shape tomorrow.</p>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-xl flex items-start gap-4 hover:-translate-y-2 transition-transform duration-300 border-cyan-500/30">
                <div className="bg-cyan-500/20 p-3 rounded-lg text-cyan-400">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 uppercase tracking-wide">Entrepreneurship</h3>
                  <p className="text-sm text-slate-400">Build sustainable ventures. The future belongs to those who dare to build it.</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl flex items-start gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="bg-indigo-500/20 p-3 rounded-lg text-indigo-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 uppercase tracking-wide">Technology</h3>
                  <p className="text-sm text-slate-400">Leverage cutting-edge tech to disrupt industries and solve global challenges.</p>
                </div>
              </div>
            </div>

            {/* Left Side Quote (like in poster) */}
            <div className="absolute left-8 top-1/2 transform -translate-y-1/2 hidden lg:block w-48 text-left border-l-2 border-cyan-500/50 pl-4">
              <p className="pixel-font text-xs leading-relaxed text-slate-300 uppercase tracking-widest">
                The future<br/>
                belongs to<br/>
                those who<br/>
                dare to build<br/>
                it.
              </p>
            </div>
            
          </div>
        </section>

        {/* Events Section */}
        <section className="relative px-4 py-24 max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-16">
            <div className="h-[1px] w-16 md:w-32 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-400" />
              FEATURED EVENTS
            </h2>
            <div className="h-[1px] w-16 md:w-32 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <div 
                    key={event.id}
                    className="group glass-card rounded-2xl overflow-hidden hover:border-cyan-400/60 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 hover:-translate-y-3 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]"
                    style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                  >
                    <div className="aspect-[4/3] w-full bg-[#050B14] relative overflow-hidden">
                      {event.posterUrl ? (
                        <img 
                          src={event.posterUrl} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#050B14] to-[#0A1930]">
                          <Globe className="w-12 h-12 text-slate-700 mb-2" />
                          <span className="text-slate-500 font-medium text-sm tracking-widest uppercase">No Poster Available</span>
                        </div>
                      )}
                      {/* Glassy overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent opacity-90"></div>
                    </div>
                    
                    <div className="p-6 relative -mt-12 z-10">
                      <div className="bg-[#0A1128] border border-cyan-500/30 p-5 rounded-xl shadow-xl backdrop-blur-xl">
                        <h3 className="text-xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                          {event.title}
                        </h3>
                        
                        <button 
                          onClick={() => onNavigate(`/exult/event/${event.slug}`)}
                          className="w-full relative overflow-hidden rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold py-3 px-4 transition-all duration-300 hover:bg-cyan-500 hover:text-[#020205] hover:border-transparent group/btn flex items-center justify-center gap-2"
                        >
                          <span className="relative z-10">VIEW DETAILS</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <div className="glass-card max-w-md mx-auto p-8 rounded-2xl border-dashed border-cyan-500/30">
                    <Zap className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Systems Online</h3>
                    <p className="text-slate-400">Event modules are currently initializing. Check back soon for the lineup.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Footer Accent */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30 mt-12"></div>
      </div>
    </div>
  );
};

export default ExultHome;
