import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, ChevronDown, Lightbulb, Settings, Star, MessageCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import iedcLogo from '../images/iedc-logo.png';
import logo from '../images/logo.png';

interface Props {
  onNavigate: (path: string) => void;
}

const WelcomeFirstYears: React.FC<Props> = ({ onNavigate }) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    email: '',
    phone: '',
    branch: ''
  });
  const [settings, setSettings] = useState<{ whatsappLink: string, customFields: any[] }>({
    whatsappLink: '',
    customFields: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'config', 'freshers_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Failed to fetch freshers settings", err);
      }
    };
    fetchSettings();
  }, []);

  const branches = [
    'Computer Science & Engineering',
    'Civil Engineering',
    'Electrical & Electronics Engineering',
    'Electronics & Communication Engineering',
    'Electrical and Computer Engineering'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'first_year_registrations'), {
        ...formData,
        timestamp: serverTimestamp()
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
          className="max-w-xl w-full text-center bg-white dark:bg-stone-900/90 p-12 rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_100px_-15px_rgba(0,0,0,0.7)] border border-stone-200/50 dark:border-stone-800"
        >
          <div className="w-24 h-24 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-white mb-6 tracking-tight leading-tight">
            Welcome to the IEDC Community
          </h2>
          
          <p className="text-stone-500 dark:text-stone-400 mb-12 font-medium leading-relaxed text-lg">
            You’re now part of a community driven by innovation, ideas, and entrepreneurship. Stay connected with us for upcoming events, opportunities, and updates.
          </p>
          
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
            {settings.whatsappLink && (
              <a 
                href={settings.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-8 py-4 bg-[#25D366] text-white font-extrabold hover:bg-[#1DA851] transition-all duration-300 text-sm tracking-widest uppercase rounded-full shadow-[0_10px_30px_-5px_rgb(37,211,102,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(37,211,102,0.5)] hover:-translate-y-1 flex items-center justify-center gap-3 group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Join WhatsApp Group
              </a>
            )}
            <button 
              onClick={() => onNavigate('/')}
              className="w-full px-8 py-4 bg-transparent border-2 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition-all duration-300 text-sm tracking-widest uppercase rounded-full"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0a] font-sans selection:bg-stone-200 dark:selection:bg-stone-800 selection:text-stone-900 dark:selection:text-white relative overflow-hidden">
      {/* Top Logo: Right on Mobile, Left on Desktop */}
      <div className="absolute top-6 right-6 md:right-auto md:left-12 z-50">
        <img src={logo} alt="Logo" className="h-14 md:h-20 w-auto object-contain" />
      </div>

      {/* Background Pattern (Circuit/Lines) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.08] md:opacity-[0.04] dark:opacity-[0.15] dark:md:opacity-[0.08] overflow-hidden" aria-hidden="true">
        <svg className="w-[150vw] h-full md:w-full md:h-full md:max-w-5xl" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="0.2">
          {/* Original paths */}
          <path d="M0,50 L30,50 L40,40 L60,40 L70,50 L100,50 M30,50 L30,60 L50,80 L80,80 M70,50 L70,30 L90,10 M10,30 L20,30 L30,40 L30,50" />
          <path d="M20,70 L30,80 L60,80 L70,70 L100,70" />
          {/* Vertical fill paths for mobile */}
          <path d="M50,0 L50,20 L70,40 M30,0 L40,10 L40,30 M80,10 L90,20 M10,10 L20,20 M50,100 L50,80 L30,60 M70,90 L60,80 L60,60 M20,90 L10,80 M90,90 L80,80" />
          
          {/* Original circles */}
          <circle cx="30" cy="50" r="0.4" fill="currentColor"/><circle cx="70" cy="50" r="0.4" fill="currentColor"/>
          <circle cx="40" cy="40" r="0.4" fill="currentColor"/><circle cx="60" cy="40" r="0.4" fill="currentColor"/>
          <circle cx="90" cy="10" r="0.4" fill="currentColor"/><circle cx="50" cy="80" r="0.4" fill="currentColor"/>
          <circle cx="20" cy="30" r="0.4" fill="currentColor"/><circle cx="70" cy="70" r="0.4" fill="currentColor"/>
          
          {/* Additional mobile circles */}
          <circle cx="50" cy="20" r="0.4" fill="currentColor"/><circle cx="40" cy="10" r="0.4" fill="currentColor"/>
          <circle cx="50" cy="80" r="0.4" fill="currentColor"/><circle cx="60" cy="80" r="0.4" fill="currentColor"/>
        </svg>
      </div>

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.01] dark:opacity-[0.03] z-0">
        <img src={iedcLogo} alt="IEDC Logo Watermark" className="w-[120vw] md:w-[80vw] max-w-[800px] object-contain grayscale" />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-20 pb-20 min-h-screen flex flex-col lg:flex-row items-center justify-between gap-20 relative z-10">
        
        {/* Left Column: Typography & Copy */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="flex-1 w-full lg:-mt-16 xl:-mt-24"
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
          `}</style>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="relative inline-block mb-16 md:mb-20 mt-6 md:mt-0"
          >
            {/* WELCOME */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black uppercase tracking-tighter text-stone-900 dark:text-white leading-none drop-shadow-sm">
              WELCOME
            </h1>

            {/* Freshers! and underline */}
            <motion.div 
              className="absolute left-0 right-0 -bottom-10 md:-bottom-16 flex justify-center w-full"
              animate={{ rotate: [-2, 1, -2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <span 
                  style={{ fontFamily: "'Caveat', cursive" }} 
                  className="text-5xl md:text-6xl lg:text-7xl text-stone-800 dark:text-stone-300 drop-shadow-xl z-10 relative pr-4"
                >
                  Freshers!
                </span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div variants={fadeUp} className="max-w-md ml-1 md:ml-2">
            <h3 className="text-xl md:text-2xl font-extrabold text-stone-900 dark:text-white leading-snug mb-6">
              Your Journey to Innovation starts here.
            </h3>
            
            <p className="text-stone-500 dark:text-stone-400 font-light leading-relaxed mb-10">
              Join the <span className="font-medium text-stone-900 dark:text-stone-200">Innovation and Entrepreneurship Development Centre (IEDC)</span> of CE Kidangoor. Transform ideas into reality, build a network of makers, and become a leader of tomorrow.
            </p>
            
            <div className="flex items-center gap-8 mt-12">
               <div className="flex flex-col items-center gap-3">
                 <Lightbulb className="w-6 h-6 text-stone-800 dark:text-stone-200" strokeWidth={1.5} />
                 <span className="text-[10px] font-bold text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em]">Ideate.</span>
               </div>
               <div className="flex flex-col items-center gap-3">
                 <Settings className="w-6 h-6 text-stone-800 dark:text-stone-200" strokeWidth={1.5} />
                 <span className="text-[10px] font-bold text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em]">Innovate.</span>
               </div>
               <div className="flex flex-col items-center gap-3">
                 <Star className="w-6 h-6 text-stone-800 dark:text-stone-200" strokeWidth={1.5} />
                 <span className="text-[10px] font-bold text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em]">Impact.</span>
               </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Minimal Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.3 }}
          className="w-full max-w-md lg:w-[400px]"
        >
          <div className="bg-stone-100 dark:bg-stone-900/90 p-10 md:p-12 shadow-[0_40px_100px_-10px_rgba(0,0,0,0.4)] dark:shadow-[0_40px_100px_-10px_rgba(0,0,0,0.8)] rounded-3xl border border-stone-200/50 dark:border-stone-800 relative z-10">
            <div className="mb-10">
              <h3 className="text-xl font-medium text-stone-900 dark:text-white mb-2 tracking-tight">Join the Community</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm font-light">Provide your details to stay updated.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs tracking-wide">
                  {error}
                </div>
              )}
              
              <div className="relative group">
                <input 
                  type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors placeholder-transparent shadow-sm shadow-stone-200/50 dark:shadow-black/50"
                  placeholder="Name"
                  id="name"
                />
                <label htmlFor="name" className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-stone-900 dark:peer-focus:text-white uppercase tracking-widest pointer-events-none">Full Name</label>
              </div>

              <div className="relative group">
                <input 
                  type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors placeholder-transparent shadow-sm shadow-stone-200/50 dark:shadow-black/50"
                  placeholder="Email"
                  id="email"
                />
                <label htmlFor="email" className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-stone-900 dark:peer-focus:text-white uppercase tracking-widest pointer-events-none">Email Address</label>
              </div>

              <div className="relative group">
                <input 
                  type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors placeholder-transparent shadow-sm shadow-stone-200/50 dark:shadow-black/50"
                  placeholder="Phone"
                  id="phone"
                />
                <label htmlFor="phone" className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-stone-900 dark:peer-focus:text-white uppercase tracking-widest pointer-events-none">Phone Number</label>
              </div>

              <div className="relative group">
                <select 
                  required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}
                  className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors appearance-none cursor-pointer text-sm shadow-sm shadow-stone-200/50 dark:shadow-black/50"
                  id="branch"
                >
                  <option value="" disabled className="text-stone-500 dark:text-stone-500">Select Branch</option>
                  {branches.map(b => (
                    <option key={b} value={b} className="text-stone-900 dark:text-stone-900">{b}</option>
                  ))}
                </select>
                <label htmlFor="branch" className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium uppercase tracking-widest pointer-events-none transition-all">Select Branch</label>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>

              {settings.customFields.map((field) => (
                <div className="relative group" key={field.id}>
                  {field.type === 'select' ? (
                    <>
                      <select 
                        required={field.required} 
                        value={formData[field.id] || ''} 
                        onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                        className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors appearance-none cursor-pointer text-sm shadow-sm shadow-stone-200/50 dark:shadow-black/50"
                        id={field.id}
                      >
                        <option value="" disabled className="text-stone-500 dark:text-stone-500">Select {field.label}</option>
                        {field.options.split(',').map((opt: string) => (
                          <option key={opt.trim()} value={opt.trim()} className="text-stone-900 dark:text-stone-900">{opt.trim()}</option>
                        ))}
                      </select>
                      <label htmlFor={field.id} className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium uppercase tracking-widest pointer-events-none transition-all">{field.label}</label>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </>
                  ) : field.type === 'textarea' ? (
                    <>
                      <textarea 
                        required={field.required} 
                        value={formData[field.id] || ''} 
                        onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                        className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors placeholder-transparent shadow-sm shadow-stone-200/50 dark:shadow-black/50 min-h-[100px] resize-y"
                        placeholder={field.label}
                        id={field.id}
                      />
                      <label htmlFor={field.id} className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-stone-900 dark:peer-focus:text-white uppercase tracking-widest pointer-events-none">{field.label}</label>
                    </>
                  ) : field.type === 'radio' ? (
                    <div className="bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm shadow-stone-200/50 dark:shadow-black/50">
                      <label className="block text-[10px] text-stone-500 font-medium uppercase tracking-widest mb-3">{field.label}</label>
                      <div className="flex flex-col gap-3">
                        {field.options.split(',').map((opt: string) => (
                          <label key={opt.trim()} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="radio"
                              name={field.id}
                              value={opt.trim()}
                              checked={formData[field.id] === opt.trim()}
                              onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                              required={field.required}
                              className="w-4 h-4 text-stone-900 dark:text-stone-100 bg-stone-100 border-stone-300 focus:ring-stone-900 dark:focus:ring-stone-100 dark:bg-stone-800 dark:border-stone-600"
                            />
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">{opt.trim()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <input 
                        type="text" 
                        required={field.required} 
                        value={formData[field.id] || ''} 
                        onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                        className="peer w-full bg-white/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl px-5 pt-6 pb-2 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors placeholder-transparent shadow-sm shadow-stone-200/50 dark:shadow-black/50"
                        placeholder={field.label}
                        id={field.id}
                      />
                      <label htmlFor={field.id} className="absolute left-5 top-2 text-[10px] text-stone-500 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-stone-900 dark:peer-focus:text-white uppercase tracking-widest pointer-events-none">{field.label}</label>
                    </>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 px-6 text-sm tracking-[0.2em] uppercase hover:bg-stone-800 dark:hover:bg-stone-100 transition-all rounded-full flex items-center justify-center gap-4 group shadow-lg shadow-stone-900/10 dark:shadow-white/10"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default WelcomeFirstYears;
