import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Radio, Calendar, Volume2, Share2, MessageSquare, AlertTriangle } from 'lucide-react';
import iedcLogo from '../images/iedc-logo.jpeg';
import ieeeLogo from '../images/ieee_logo.png';
import bgImage from '../images/bg.jpg';

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
      <div className="min-h-screen bg-[#050E09] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin mb-4"></div>
        <p className="font-bold tracking-widest text-xs uppercase text-[#D4AF37]/80">Connecting to Stream Feed...</p>
      </div>
    );
  }

  const hostname = window.location.hostname;
  // YouTube Live Chat embed requires the current domain as parameter
  const chatUrl = stream?.youtubeId
    ? `https://www.youtube.com/live_chat?v=${stream.youtubeId}&embed_domain=${hostname}`
    : '';

  return (
    <div className="min-h-screen bg-[#020704] text-white overflow-x-hidden relative font-sans select-none">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Antonio:wght@700&family=Outfit:wght@400;500;600;700;800&family=Share+Tech+Mono&display=swap');
        
        .condensed-font {
          font-family: 'Antonio', sans-serif;
          text-transform: uppercase;
        }

        .mono-font {
          font-family: 'Share Tech Mono', monospace;
        }

        .poster-title-glow {
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(212, 175, 55, 0.2);
        }

        .gold-glow {
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.2);
        }

        .stadium-bg {
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .glass-card-live {
          background: rgba(10, 20, 15, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(212, 175, 55, 0.15);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.6);
        }

        .glass-card-live:hover {
          border-color: rgba(212, 175, 55, 0.3);
        }

        .glow-button {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%);
          border: 1px solid rgba(212, 175, 55, 0.4);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
        }

        .glow-button:hover {
          background: rgba(212, 175, 55, 0.9);
          color: #020704;
          box-shadow: 0 0 25px rgba(212, 175, 55, 0.4);
          border-color: transparent;
        }

        /* Floating Sparks/Particles */
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
          background: rgba(212, 175, 55, 0.6);
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
            border-color: rgba(212, 175, 55, 0.15); 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.05); 
          }
          50% { 
            border-color: rgba(212, 175, 55, 0.55); 
            box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.25); 
          }
        }
        .partner-banner-glow {
          animation: border-glow-shift 6s ease-in-out infinite;
        }

        .partner-text-shimmer {
          background: linear-gradient(to right, #ffffff 20%, #D4AF37 40%, #D4AF37 60%, #ffffff 80%);
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

      {/* Ambient background with stadium light overlays */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 stadium-bg"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(2, 7, 4, 0.75) 0%, rgba(2, 7, 4, 0.95) 100%), url(${bgImage})` }}
      ></div>
      
      {/* Decorative Golden Ambient Spotlights */}
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-[#D4AF37]/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[#C89D3C]/10 blur-[120px] pointer-events-none z-0"></div>
      
      {/* Animated Floating Sparks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="spark spark-1"></div>
        <div className="spark spark-2"></div>
        <div className="spark spark-3"></div>
        <div className="spark spark-4"></div>
        <div className="spark spark-5"></div>
      </div>

      {/* Page Header (Always visible, styled like the poster) */}
      <header className="relative z-10 w-full pt-10 pb-6 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          {/* PRESENTS Subtitle */}
          <div className="flex items-center gap-2 mb-2">
            <span className="h-[1px] w-8 bg-[#C89D3C]/50"></span>
            <p className="font-semibold text-xs tracking-[0.25em] text-[#D4AF37]/90 uppercase">
              COLLEGE UNION 25 - 26 <span className="text-white/60 mx-1">|</span> COLLEGE OF ENGINEERING KIDANGOOR
            </p>
            <span className="h-[1px] w-8 bg-[#C89D3C]/50"></span>
          </div>

          <div className="text-[10px] font-bold text-[#C89D3C] tracking-[0.4em] uppercase mb-4 flex items-center gap-1.5">
            ★★★ PRESENTS ★★★
          </div>

          {/* CEK SUPER LEAGUE SEASON 1 Header */}
          <h2 className="text-[#D4AF37] font-bold tracking-[0.2em] text-sm md:text-lg uppercase mb-1 font-sans gold-glow">
            CEK Super League Season 1
          </h2>

          {/* MEGA FOOTBALL text */}
          <h3 className="text-white font-extrabold tracking-[0.3em] text-lg md:text-2xl uppercase mb-1 font-sans">
            Mega Football
          </h3>

          {/* Massive AUCTION Header */}
          <h1 className="condensed-font text-7xl md:text-9xl font-extrabold tracking-[0.05em] text-white leading-none mb-4 poster-title-glow">
            Auction
          </h1>

          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6"></div>

          {/* Premium Partners Banner at the Top - Enriched, Enlarged and Animated */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-4 px-8 py-5 bg-black/60 border rounded-3xl backdrop-blur-lg max-w-3xl mx-auto shadow-2xl partner-banner-glow">
            {/* Branding Partner (IEDC CEK) */}
            <div className="flex items-center gap-4 animate-float-partner-1">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border-2 border-white/20 shrink-0 shadow-xl overflow-hidden transition-transform hover:scale-105 duration-300">
                <img 
                  src={iedcLogo} 
                  alt="IEDC CEK Logo" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#D4AF37]/90 font-bold uppercase tracking-widest">Branding & Ecosystem Partner</div>
                <div className="text-xl md:text-2xl font-extrabold uppercase leading-none mt-1 partner-text-shimmer">IEDC CEK</div>
              </div>
            </div>

            <div className="hidden sm:block h-12 w-[1px] bg-white/15"></div>

            {/* Technical Partner (IEEE CEK) */}
            <div className="flex items-center gap-4 animate-float-partner-2">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center p-2 border-2 border-white/20 shrink-0 shadow-xl relative overflow-hidden transition-transform hover:scale-105 duration-300">
                {ieeeLogoError || !stream?.showIeeeLogoImage ? (
                  <span className="font-black text-xs text-white tracking-widest uppercase">IEEE</span>
                ) : (
                  <img 
                    src={ieeeLogo} 
                    alt="IEEE CEK Logo" 
                    onError={() => setIeeeLogoError(true)} 
                    className="w-full h-full object-contain rounded-xl"
                  />
                )}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#D4AF37]/90 font-bold uppercase tracking-widest">Technical Partner</div>
                <div className="text-xl md:text-2xl font-extrabold uppercase leading-none mt-1 partner-text-shimmer">IEEE CEK</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main View */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pb-20 flex flex-col gap-6">
        
        {/* Player Container Card */}
        <div className="glass-card-live rounded-2xl overflow-hidden p-2 transition-all duration-300 relative shadow-2xl">
          
          {/* Top controls ribbon */}
          <div className="flex items-center justify-between p-3 border-b border-white/10 text-xs text-white/70">
            <div className="flex items-center gap-3">
              {stream?.status === 'live' ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-red-600 rounded text-white font-black tracking-wider uppercase animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  LIVE
                </div>
              ) : stream?.status === 'upcoming' ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-[#D4AF37] text-black rounded font-black tracking-wider uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  UPCOMING
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-700 rounded text-white font-black tracking-wider uppercase">
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
                    showChat ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : ''
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
          <div className="relative aspect-video w-full bg-black/60 flex items-center justify-center">
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#051A0E]/90 to-black/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] mb-6 animate-pulse">
                  <Volume2 className="w-8 h-8" />
                </div>
                
                <p className="font-bold text-[#D4AF37] uppercase tracking-widest text-xs mb-3">CSL Auction Live Stream Begins In</p>
                
                {/* Grid of countdown dials */}
                <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-md mx-auto mb-6">
                  {[
                    { val: timeLeft.days, label: 'Days' },
                    { val: timeLeft.hours, label: 'Hours' },
                    { val: timeLeft.minutes, label: 'Mins' },
                    { val: timeLeft.seconds, label: 'Secs' }
                  ].map((d, idx) => (
                    <div key={idx} className="bg-black/60 border border-white/10 rounded-xl px-3 py-4 md:px-5 md:py-6 flex flex-col items-center shadow-lg min-w-[70px]">
                      <span className="mono-font text-2xl md:text-4xl font-extrabold text-white">{String(d.val).padStart(2, '0')}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">{d.label}</span>
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#051A0E]/90 to-black/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 bg-white/5 border border-white/15 rounded-full text-slate-400 mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold uppercase tracking-wider text-white mb-2">Auction Stream Ended</h4>
                <p className="text-slate-400 text-xs max-w-md uppercase tracking-wide">
                  The live bidding phase has concluded. Thank you for tuning in to the CEK Super League Season 1 Football Auction.
                </p>
                {stream?.youtubeId && (
                  <a
                    href={`https://youtube.com/watch?v=${stream.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 px-5 py-2.5 bg-white/5 border border-white/20 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                  >
                    Watch Replay on YouTube
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Video description text card (below player) */}
        <div className="glass-card-live rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold uppercase tracking-wide text-white">{stream?.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">{stream?.description}</p>
          
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
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
    </div>
  );
};

export default CslLive;
