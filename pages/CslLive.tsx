import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Radio, Calendar, Volume2, Share2, MessageSquare, AlertTriangle } from 'lucide-react';
import iedcLogo from '../images/iedc-logo.png';
import ieeeLogo from '../images/ieee-logo.png';
import bgImage from '../images/bg2.jpeg'; // New deep red poster background

interface StreamData {
  youtubeId: string;
  status: 'upcoming' | 'live' | 'ended';
  scheduledTime: string;
  title: string;
  description: string;
  showIeeePartner: boolean;
  showIeeeLogoImage?: boolean;
}

interface CslLiveProps {
  onNavigate?: (path: string) => void;
}

const CslLive: React.FC<CslLiveProps> = ({ onNavigate }) => {
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ieeeLogoError, setIeeeLogoError] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 1. Listen to stream config in real-time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'live_stream'), (docSnap) => {
      if (docSnap.exists()) {
        setStream(docSnap.data() as StreamData);
      } else {
        // Fallback defaults if document doesn't exist
        setStream({
          youtubeId: 'dQw4w9WgXcQ',
          status: 'upcoming',
          scheduledTime: new Date(Date.now() + 86400000).toISOString(),
          title: 'CEK SUPER LEAGUE SEASON 1 - MEGA FOOTBALL AUCTION',
          description: 'Watch the live auction of CEK Super League Season 1, where teams bid for the finest players.',
          showIeeePartner: false,
          showIeeeLogoImage: false
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Countdown logic
  useEffect(() => {
    if (!stream || stream.status !== 'upcoming' || !stream.scheduledTime) return;

    const calculateTime = () => {
      const difference = +new Date(stream.scheduledTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [stream]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0000] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#D40000] animate-spin mb-4"></div>
        <p className="font-bebas tracking-widest text-lg text-white/80">Connecting to Stream Feed...</p>
      </div>
    );
  }

  const hostname = window.location.hostname;
  // YouTube Live Chat embed requires the current domain as parameter
  const chatUrl = stream?.youtubeId
    ? `https://www.youtube.com/live_chat?v=${stream.youtubeId}&embed_domain=${hostname}`
    : '';

  return (
    <div className="min-h-screen bg-[#050000] text-white overflow-x-hidden relative font-sans select-none flex flex-col">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700;800&family=Share+Tech+Mono&display=swap');
        
        .condensed-font {
          font-family: 'Bebas Neue', sans-serif;
          text-transform: uppercase;
        }

        .mono-font {
          font-family: 'Share Tech Mono', monospace;
        }

        .poster-title-glow {
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 0, 0, 0.3);
        }

        .red-glow {
          text-shadow: 0 0 10px rgba(230, 0, 0, 0.7), 0 0 20px rgba(230, 0, 0, 0.4);
        }

        .stadium-bg {
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .glass-card-live {
          background: rgba(15, 0, 0, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.8);
        }

        .glass-card-live:hover {
          border-color: rgba(255, 0, 0, 0.4);
        }

        .glow-button {
          background: linear-gradient(135deg, rgba(230, 0, 0, 0.4) 0%, rgba(150, 0, 0, 0.1) 100%);
          border: 1px solid rgba(255, 0, 0, 0.5);
          box-shadow: 0 0 15px rgba(230, 0, 0, 0.2);
        }

        .glow-button:hover {
          background: rgba(230, 0, 0, 0.9);
          color: white;
          box-shadow: 0 0 25px rgba(255, 0, 0, 0.5);
          border-color: transparent;
        }

        /* Floating Sparks/Particles - Now Red/White */
        @keyframes float-sparks {
          0% { transform: translateY(100vh) translateX(0) scale(0.8); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-10vh) translateX(100px) scale(1.2); opacity: 0; }
        }

        .spark {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
        }

        .spark-1 { left: 10%; animation: float-sparks 12s infinite linear; }
        .spark-2 { left: 30%; animation: float-sparks 18s infinite linear 2s; }
        .spark-3 { left: 55%; animation: float-sparks 15s infinite linear 4s; }
        .spark-4 { left: 75%; animation: float-sparks 20s infinite linear 1s; }
        .spark-5 { left: 90%; animation: float-sparks 14s infinite linear 6s; }

        /* Floating Partners & Shimmer Glow */
        @keyframes float-partner-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float-partner-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float-partner-1 {
          animation: float-partner-1 4.5s ease-in-out infinite;
        }
        .animate-float-partner-2 {
          animation: float-partner-2 4.5s ease-in-out infinite 2.25s;
        }
        @keyframes border-glow-shift {
          0%, 100% { 
            border-color: rgba(255, 255, 255, 0.1); 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 0, 0, 0.05); 
          }
          50% { 
            border-color: rgba(255, 0, 0, 0.4); 
            box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 0, 0, 0.3); 
          }
        }
        .partner-banner-glow {
          animation: border-glow-shift 6s ease-in-out infinite;
        }

        .partner-text-shimmer {
          background: linear-gradient(to right, #ffffff 20%, #ff4d4d 40%, #ff4d4d 60%, #ffffff 80%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: text-shimmer 4s linear infinite;
        }
        @keyframes text-shimmer {
          to { background-position: 200% center; }
        }
      `}</style>

      {/* Ambient background with stadium light overlays - Deep Red Tint */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 stadium-bg mix-blend-overlay"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#4a0000]/40 via-black/60 to-[#0a0000]/95"></div>
      
      {/* Decorative Red Ambient Spotlights */}
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-red-700/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[#cc0000]/10 blur-[120px] pointer-events-none z-0"></div>
      
      {/* Animated Floating Sparks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="spark spark-1"></div>
        <div className="spark spark-2"></div>
        <div className="spark spark-3"></div>
        <div className="spark spark-4"></div>
        <div className="spark spark-5"></div>
      </div>

      {/* Professional Sponsor Bar (Sticky Navbar style at the absolute top of the page - hidden on mobile) */}
      <nav className="hidden sm:block relative z-20 w-full bg-transparent px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          
          {/* Branding Partner (IEDC CEK) - Enlarged w-16 logo */}
          <div className="flex items-center gap-2 animate-float-partner-1">
            <div className="text-left">
              <div className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest leading-none mt-1">Branding & Ecosystem Partner</div>
              <div className="h-10 md:h-10 w-auto flex items-center justify-start shrink-0 drop-shadow-2xl transition-transform hover:scale-105 duration-300">
                <img 
                  src={iedcLogo} 
                  alt="IEDC CEK Logo" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Center Brand Divider for Broadcast */}
          <div className="hidden md:flex flex-col items-center text-center absolute left-1/2 -translate-x-1/2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Official Event Partners</span>
            <span className="text-xs tracking-[0.15em] uppercase text-white font-black font-bebas mt-1">CSL Auction Season 1</span>
          </div>

          {/* Technical Partner (IEEE CEK) - Enlarged w-16 logo */}
          <div className="flex items-center gap-2 animate-float-partner-2">
            <div className="text-right">
              <div className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest leading-none mt-1">Technical Partner</div>
              <div className="h-6 md:h-6 mt-1 w-auto flex items-center justify-end shrink-0 drop-shadow-2xl relative transition-transform hover:scale-105 duration-300">
                {ieeeLogoError ? (
                  <span className="font-black text-xs text-white tracking-widest uppercase">IEEE</span>
                ) : (
                  <img 
                    src={ieeeLogo} 
                    alt="IEEE CEK Logo" 
                    onError={() => setIeeeLogoError(true)} 
                    className="h-full w-auto object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header (Always visible, styled like the poster) */}
      <header className="relative z-10 w-full pt-8 pb-6 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          {/* ALORA PRESENTS Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <span className="text-3xl md:text-5xl tracking-[0.15em] uppercase text-white font-black font-bebas leading-none">ALORA</span>
            <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-white/90 font-bold mt-2">College Union 25 - 26</span>
            <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white/50 font-semibold mt-1">College of Engineering Kidangoor</span>
            <div className="text-[10px] md:text-xs font-bold text-red-400 tracking-[0.4em] uppercase mt-4 flex items-center gap-1.5">
               PRESENTS 
            </div>
          </div>

          {/* MEGA FOOTBALL AUCTION (Restored to top) */}
          <h3 className="text-white font-extrabold tracking-[0.3em] text-sm md:text-xl uppercase mb-2 font-sans">
            Mega Football
          </h3>
          <h1 className="font-bebas text-7xl md:text-[10rem] font-black tracking-[0.02em] text-white leading-none mb-4 drop-shadow-2xl">
            AUCTION
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-10"></div>

          {/* LIVE STREAM Title Box (Scaled down) */}
          <div className="bg-white px-6 py-2 mb-6 relative border-r-[4px] border-b-[4px] border-black/20 transform hover:scale-105 transition-transform duration-300">
            <h2 className="condensed-font text-4xl md:text-6xl font-black tracking-tight text-[#A30000] leading-none m-0 shadow-sm">
              LIVE STREAM
            </h2>
            {/* Edge grunge lines / detail */}
            <div className="absolute right-[-10px] top-[20%] w-[2px] h-[60%] bg-[#A30000] opacity-80"></div>
            <div className="absolute right-[-15px] top-[30%] w-[1px] h-[40%] bg-red-900 opacity-50"></div>
          </div>

          {/* ASAP HALL Subtitle (Smaller) */}
          <div className="flex items-center gap-3 mb-6">
            <p className="font-medium text-xs md:text-sm tracking-widest text-white/90 uppercase font-sans">
              ASAP HALL <span className="text-white/40 mx-2">|</span> FRIDAY JULY 17 <span className="text-white/40 mx-2">|</span> 12:30 PM
            </p>
          </div>

          {/* CEK SUPER LEAGUE Header (Smaller) */}
          <h3 className="text-white font-black tracking-widest text-xl md:text-3xl uppercase mb-2 condensed-font">
            CEK Super League
          </h3>

          {/* SEASON 1 Sub (Smaller) */}
          <h4 className="text-red-300 font-semibold tracking-[0.3em] text-sm md:text-base uppercase mb-6 font-sans">
            Season 1
          </h4>

          {/* WHERE TEAMS ARE BUILT (Smaller) */}
          <p className="text-white font-medium text-sm md:text-base tracking-widest uppercase mb-6 font-sans red-glow">
            Where Teams Are Built
          </p>

          {/* Mobile-only Partner Section (Moved above stream) */}
          <div className="sm:hidden w-full flex flex-col items-center gap-6 relative z-10 mb-8 border-y border-white/10 py-6 bg-black/20">
            <h4 className="text-white/50 text-[10px] tracking-[0.3em] font-bold uppercase mb-2">Official Event Partners</h4>
            
            <div className="flex flex-col items-center gap-8 w-full max-w-sm">
              {/* IEDC CEK */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest leading-none">Branding & Ecosystem Partner</div>
                <div className="h-28 w-auto flex items-center justify-center shrink-0 drop-shadow-2xl">
                  <img src={iedcLogo} alt="IEDC CEK Logo" className="h-full w-auto object-contain" />
                </div>
              </div>
              
              {/* IEEE CEK */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest leading-none">Technical Partner</div>
                <div className="h-8 w-auto flex items-center justify-center shrink-0 drop-shadow-2xl">
                  {ieeeLogoError ? (
                    <span className="font-black text-xs text-white tracking-widest uppercase">IEEE</span>
                  ) : (
                    <img src={ieeeLogo} alt="IEEE CEK Logo" onError={() => setIeeeLogoError(true)} className="h-full w-auto object-contain" />
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main View */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pb-20 flex flex-col gap-6 w-full">
        
        {/* Player Container Card */}
        <div className="glass-card-live rounded-2xl overflow-hidden p-2 transition-all duration-300 relative shadow-2xl w-full">
          
          {/* Top controls ribbon */}
          <div className="flex items-center justify-between p-3 border-b border-white/10 text-xs text-white/70">
            <div className="flex items-center gap-3">
              {stream?.status === 'live' ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-red-600 rounded text-white font-black tracking-wider uppercase animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  LIVE
                </div>
              ) : stream?.status === 'upcoming' ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-red-800 text-white rounded font-black tracking-wider uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  UPCOMING
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded text-white font-black tracking-wider uppercase">
                  STREAM ENDED
                </div>
              )}
              <span className="font-semibold text-slate-300 hidden sm:inline uppercase max-w-xs truncate">{stream?.title}</span>
            </div>

            <div className="flex items-center gap-2">
              {stream?.status === 'live' && (
                <button 
                  onClick={() => setShowChat(!showChat)}
                  className={`p-1.5 hover:bg-white/10 rounded transition-colors text-white/80 hover:text-white flex items-center gap-1.5 ${
                    showChat ? 'bg-red-900/40 text-red-400 border border-red-500/30' : ''
                  }`}
                  title={showChat ? "Hide Chat" : "Show Chat"}
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span className="hidden sm:inline font-bold uppercase text-[10px]">Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Player Display Section */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {stream?.status === 'live' && stream.youtubeId ? (
              <div className={`w-full h-full flex ${showChat ? 'flex-col md:flex-row' : ''}`}>
                <iframe
                  src={`https://www.youtube.com/embed/${stream.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full flex-1"
                ></iframe>
                
                {showChat && (
                  <div className="w-full md:w-[320px] h-[200px] md:h-full border-t md:border-t-0 md:border-l border-white/10 bg-black">
                    <iframe
                      src={chatUrl}
                      title="YouTube live chat"
                      frameBorder="0"
                      className="w-full h-full"
                    ></iframe>
                  </div>
                )}
              </div>
            ) : stream?.status === 'upcoming' ? (
              /* Countdown Display Overlay */
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000]/95 to-black/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-full text-red-500 mb-6 animate-pulse">
                  <Volume2 className="w-8 h-8" />
                </div>
                
                <p className="font-bold text-red-400 uppercase tracking-widest text-sm mb-4">CSL Auction Live Stream Begins In</p>
                
                {/* Grid of countdown dials */}
                <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-md mx-auto mb-6">
                  {[
                    { val: timeLeft.days, label: 'Days' },
                    { val: timeLeft.hours, label: 'Hours' },
                    { val: timeLeft.minutes, label: 'Mins' },
                    { val: timeLeft.seconds, label: 'Secs' }
                  ].map((d, idx) => (
                    <div key={idx} className="bg-black/80 border border-white/15 rounded-xl px-3 py-4 md:px-5 md:py-6 flex flex-col items-center shadow-lg min-w-[70px]">
                      <span className="mono-font text-3xl md:text-5xl font-extrabold text-white">{String(d.val).padStart(2, '0')}</span>
                      <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold mt-2">{d.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-slate-400 text-xs max-w-sm uppercase tracking-wide">
                  Scheduled for: {new Date(stream.scheduledTime).toLocaleDateString(undefined, { 
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ) : (
              /* Stream Ended Placeholder */
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000]/95 to-black/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 bg-white/5 border border-white/15 rounded-full text-slate-400 mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bebas tracking-wider text-white mb-2">Auction Stream Ended</h4>
                <p className="text-slate-400 text-xs max-w-md uppercase tracking-wide">
                  The live bidding phase has concluded. Thank you for tuning in to the CEK Super League Season 1 Football Auction.
                </p>
                {stream?.youtubeId && (
                  <a
                    href={`https://youtube.com/watch?v=${stream.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 px-5 py-2.5 bg-red-800 border border-red-500 hover:bg-red-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                  >
                    Watch Replay on YouTube
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Video description text card (below player) */}
        <div className="glass-card-live rounded-2xl p-6 space-y-4 w-full border-t-4 border-t-red-600">
          <h3 className="text-2xl font-bebas tracking-wide text-white">{stream?.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">{stream?.description}</p>
          
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <Volume2 className="w-4 h-4" />
              Brought to you by College Union 25-26
            </div>

            <button
              onClick={handleShare}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border border-white/15"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied Link!' : 'Share Stream'}
            </button>
          </div>
        </div>

      </main>

      {/* Floating Mini Back-to-IEDC button if navigating via IEDC portal */}
      {onNavigate && (
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={() => onNavigate('/')}
            className="glow-button px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300"
          >
            ← IEDC Portal
          </button>
        </div>
      )}

      {/* Floating IEEE Portal button on right */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://ieee.ce-kgr.org"
          target="_blank"
          rel="noopener noreferrer"
          className="glow-button px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 inline-block"
        >
          IEEE Portal →
        </a>
      </div>
    </div>
  );
};

export default CslLive;
