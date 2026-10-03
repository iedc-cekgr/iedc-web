import React, { useState, useEffect } from 'react';
import { ArrowRight, Lightbulb, Zap, Users, Trophy, Camera, Calendar, MapPin, ExternalLink, Clock } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, GalleryItem } from '../types';
import { EVENTS, GALLERY_ITEMS, formatImageUrl } from '../constants';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const COLOR_PALETTE = [
  "bg-[#00FF00]",
  "bg-[#FF00FF]",
  "bg-[#00FFFF]",
  "bg-[#FFDE03]",
  "bg-[#FF3D00]",
  "bg-[#3D5AFE]"
];

const ROTATIONS = [
  "hover:-rotate-2",
  "hover:rotate-2",
  "hover:-rotate-1",
  "hover:rotate-1"
];

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [highlightsList, setHighlightsList] = useState<Array<{ title: string; description: string; image: string; color: string; rotate: string }>>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    // 1. Fetch Events
    try {
      setLoadingEvents(true);
      const querySnapshot = await getDocs(collection(db, 'events'));
      const dbEvents: Event[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<Event, 'docId'>;
        if (data.isVisible !== false && (!data.approvalStatus || data.approvalStatus === 'approved')) {
          dbEvents.push({ docId: doc.id, ...data });
        }
      });

      // Sort by newest first
      dbEvents.sort((a, b) => (b.id || 0) - (a.id || 0));

      if (dbEvents.length > 0) {
        setEventsList(dbEvents.slice(0, 3)); // Top 3 newest events
      } else {
        setEventsList(EVENTS.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching home events:", err);
      setEventsList(EVENTS.slice(0, 3));
    } finally {
      setLoadingEvents(false);
    }

    // 2. Fetch Dynamic Gallery Highlights
    try {
      const gallerySnap = await getDocs(collection(db, 'gallery'));
      const dbGallery: GalleryItem[] = [];
      gallerySnap.forEach(doc => {
        const data = doc.data() as Omit<GalleryItem, 'id'>;
        dbGallery.push({ id: parseInt(doc.id) || 0, ...data });
      });

      const effectiveItems = dbGallery.length > 0 ? dbGallery : GALLERY_ITEMS;
      
      const formattedHighlights = effectiveItems.slice(0, 6).map((item, index) => ({
        title: item.title,
        description: item.category ? `${item.category} Event at IEDC CE Kidangoor` : 'Capturing innovation and student creation.',
        image: formatImageUrl(item.image),
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        rotate: ROTATIONS[index % ROTATIONS.length]
      }));

      setHighlightsList(formattedHighlights);
    } catch (err) {
      console.error("Error fetching gallery highlights:", err);
      setHighlightsList([
        {
          title: "Arduino Workshop",
          description: "Mastering electronics and prototyping with the world's most popular microcontroller board.",
          image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197872/fetch_7_nvwqs9.jpg",
          color: "bg-[#00FF00]",
          rotate: "hover:-rotate-2"
        },
        {
          title: "TOPSY TURVY",
          description: "A mind-bending competition challenging perspectives and conventional thinking.",
          image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_10_hnprbw.jpg",
          color: "bg-[#FF00FF]",
          rotate: "hover:rotate-2"
        },
        {
          title: "Python Workshop",
          description: "Hands-on coding session mastering the fundamentals of Python development.",
          image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-01-12_at_10.30.14_aenm4p.jpg",
          color: "bg-[#00FFFF]",
          rotate: "hover:-rotate-1"
        },
        {
          title: "3D Printer Workshop",
          description: "Bringing ideas to life with state-of-the-art additive manufacturing tech.",
          image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-01-12_at_10.30.13_lylvyb.jpg",
          color: "bg-[#FFDE03]",
          rotate: "hover:rotate-1"
        },
        {
          title: "Startup Pitching",
          description: "Future founders presenting their groundbreaking ideas to industry experts.",
          image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_12_kkdkz9.jpg",
          color: "bg-[#FF3D00]",
          rotate: "hover:-rotate-2"
        },
        {
          title: "PHOTOGRAPHY Contest",
          description: "Capturing the essence of innovation through the lens of pure creativity.",
          image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_14_yeigmk.jpg",
          color: "bg-[#3D5AFE]",
          rotate: "hover:rotate-2"
        }
      ]);
    }
  };

  const formatEventDate = (dateStr?: string, startIso?: string) => {
    if (startIso) {
      const d = new Date(startIso);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return dateStr || 'Upcoming';
  };

  const parseDateTime = (dtStr?: string) => {
    if (!dtStr) return null;
    if (dtStr.includes('T') && dtStr.length === 16) {
      return new Date(dtStr);
    }
    if (dtStr.includes('T')) {
      const [d, t] = dtStr.split('T');
      const [y, m, day] = d.split('-');
      const [hr, min] = t.split(':');
      if (y && m && day && hr && min) {
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(day), parseInt(hr), parseInt(min));
      }
    }
    return new Date(dtStr);
  };

  const getRegistrationStatus = (event: Event) => {
    if (event.eventType === 'website-form' && event.isRegistrationEnabled === false) {
      return { status: 'closed', message: 'Registrations Closed' };
    }
    if (event.maxParticipants && event.currentParticipants !== undefined && event.currentParticipants >= event.maxParticipants) {
      return { status: 'closed', message: 'Sold Out' };
    }
    const now = new Date();
    const regStartStr = event.registrationStartDateTime || event.startDateTime;
    const regEndStr = event.registrationEndDateTime || event.endDateTime;
    const start = parseDateTime(regStartStr);
    const end = parseDateTime(regEndStr);
    if (regStartStr && start && start > now) {
      return { status: 'not_started', message: 'Not Started Yet' };
    }
    if (regEndStr && end && end < now) {
      return { status: 'ended', message: 'Registrations Ended' };
    }
    if (!event.eventType && !event.registrationLink && !event.googleFormLink) {
      return { status: 'closed', message: 'Registrations Closed' };
    }
    return { status: 'open', message: event.registrationButtonText || 'Register Now' };
  };

  return (
    <div className="pt-32 space-y-24">
      {/* Hero Section */}
      <section className="px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block px-4 py-1 border-[3px] rounded-[10px] border-black dark:border-white bg-[#00FFFF] font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            Building The Future
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
            IDEAS <br />
            <span className="bg-[#FFDE03] px-2 border-x-[6px] border-black dark:border-white">DEMAND</span> <br />
            ACTION.
          </h1>
          <p className="text-xl font-bold text-black dark:text-white border-l-[6px] border-black dark:border-white pl-6 max-w-lg leading-tight">
            The Innovation and Entrepreneurship Development Cell at CE Kidangoor. No fluff. Just raw creation and startups.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('/about')}
              className="px-8 py-5 bg-black dark:bg-white text-white dark:text-black border-[4px] rounded-[20px] border-black dark:border-white text-xl font-black shadow-[8px_8px_0px_0px_rgba(255,222,3,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3"
            >
              LEARN MORE <ArrowRight size={24} />
            </button>
            <button 
              onClick={() => onNavigate('/execom')}
              className="px-8 py-5 bg-white dark:bg-slate-900 text-black dark:text-white border-[4px] rounded-[20px] border-black dark:border-white text-xl font-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:bg-[#FF00FF] hover:text-white transition-all"
            >
              MEET THE BOARD
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10">
            <GlassCard className="bg-[#FFDE03] p-12 hover:rotate-2">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white flex items-center justify-center mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <Lightbulb size={48} />
              </div>
              <h3 className="text-4xl font-black mb-4">WE START UP.</h3>
              <p className="font-bold text-lg mb-8">We transform engineering students into founders. If you have an idea, we have the tools.</p>
              
              <div className="grid grid-cols-2 gap-6 border-t-[4px] border-black dark:border-white pt-8">
                <div className="text-center border-r-[4px] border-black dark:border-white">
                  <div className="text-4xl font-black">12</div>
                  <div className="text-xs font-black uppercase">Startups</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black">500+</div>
                  <div className="text-xs font-black uppercase">Makers</div>
                </div>
              </div>
            </GlassCard>
          </div>
          <div className="absolute -top-6 -right-6 w-full h-full bg-[#00FFFF] border-[4px] border-black dark:border-white -z-10"></div>
        </div>
      </section>

      {/* Live & Upcoming Events Section */}
      <section className="px-6 max-w-7xl mx-auto space-y-12">
        <div className="border-b-[4px] border-black dark:border-white pb-8">
          <div className="space-y-3">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              WHAT'S HAPPENING NEXT.
            </h2>
            <p className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-300 max-w-xl">
              Discover official workshops, competitions, speaker talks, and tech fests scheduled at CE Kidangoor.
            </p>
          </div>
        </div>

        {loadingEvents ? (
          <div className="py-16 text-center font-black uppercase text-slate-400 text-lg animate-pulse">
            Loading latest campus events...
          </div>
        ) : eventsList.length === 0 ? (
          <div className="p-12 text-center border-[4px] border-dashed border-black dark:border-white rounded-2xl">
            <p className="text-2xl font-black uppercase text-slate-400">No events currently scheduled.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventsList.map((event, idx) => {
                const bgColors = ["bg-[#FFDE03]", "bg-[#00FF00]", "bg-[#FF00FF]"];
                const cardBg = bgColors[idx % bgColors.length];

                return (
                  <GlassCard 
                    key={event.docId || event.id || idx}
                    className="p-0 border-black dark:border-white flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden group hover:-translate-y-2 transition-all duration-300"
                  >
                    {/* Card Image Banner */}
                    <div className="h-52 border-b-[4px] border-black dark:border-white relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {event.image ? (
                        <img 
                          src={formatImageUrl(event.image)} 
                          alt={event.title} 
                          className="w-full h-full object-cover md:grayscale group-hover:grayscale-0 transition-all duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-black text-2xl uppercase">
                          {event.title}
                        </div>
                      )}

                      <div className="absolute top-3 left-3 bg-[#00FFFF] border-[2.5px] border-black px-3 py-1 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
                        {event.type || 'CAMPUS EVENT'}
                      </div>

                      <div className="absolute top-3 right-3 bg-white dark:bg-slate-900 border-[2.5px] border-black dark:border-white px-2.5 py-1 font-black text-[11px] uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white">
                        {event.mode === 'Online' ? <ExternalLink size={12} /> : <MapPin size={12} />}
                        {event.mode || 'Offline'}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col flex-grow justify-between bg-white dark:bg-slate-900">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                          <Calendar size={14} className="text-pink-600" />
                          <span>{formatEventDate(event.date, event.startDateTime)}</span>
                        </div>

                        <h3 className="text-2xl font-black uppercase leading-tight text-black dark:text-white">
                          {event.title}
                        </h3>

                        {event.speakerName && (
                          <p className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase">
                            Speaker: {event.speakerName}
                          </p>
                        )}

                        <p className="font-bold text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Direct Registration Link / Status Button */}
                      {(() => {
                        const regStatus = getRegistrationStatus(event);
                        if (regStatus.status === 'open') {
                          // 1. Google Form or External URL
                          if (event.eventType === 'google-form' || event.googleFormLink || (!event.eventType && event.registrationLink && !event.registrationLink.startsWith('/'))) {
                            const link = event.googleFormLink || event.registrationLink;
                            return (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`mt-6 w-full text-center ${cardBg} text-black border-[3px] border-black font-black py-3 px-4 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-2`}
                              >
                                <span>{regStatus.message}</span>
                                <ExternalLink size={16} />
                              </a>
                            );
                          }

                          // 2. Internal Route Link
                          if (!event.eventType && event.registrationLink?.startsWith('/')) {
                            return (
                              <button
                                onClick={() => onNavigate(event.registrationLink!)}
                                className={`mt-6 w-full text-center ${cardBg} text-black border-[3px] border-black font-black py-3 px-4 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-2`}
                              >
                                <span>{regStatus.message}</span>
                                <ArrowRight size={16} />
                              </button>
                            );
                          }

                          // 3. Website Form Page
                          return (
                            <button
                              onClick={() => {
                                const eventSlug = event.slug || event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                onNavigate(`/register/${eventSlug}`);
                              }}
                              className={`mt-6 w-full text-center ${cardBg} text-black border-[3px] border-black font-black py-3 px-4 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-2`}
                            >
                              <span>{regStatus.message}</span>
                              <ArrowRight size={16} />
                            </button>
                          );
                        } else {
                          // Registration Closed / Sold Out / Ended / Not Started
                          return (
                            <div className="mt-6 w-full text-center bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border-[3px] border-gray-300 dark:border-slate-700 font-black py-3 px-4 uppercase text-sm cursor-not-allowed">
                              {regStatus.message}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* VIEW ALL EVENTS Button Below Grid */}
            <div className="flex justify-center pt-6">
              <button
                onClick={() => onNavigate('/events')}
                className="px-8 py-4 bg-[#00FFFF] text-black border-[4px] rounded-[18px] border-black font-black text-lg uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3"
              >
                <span>VIEW ALL EVENTS</span>
                <ArrowRight size={22} />
              </button>
            </div>
          </>
        )}
      </section>

      {/* Pillars Section */}
      <section className="px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl mb-16 inline-block bg-black border rounded-[50px] dark:bg-white text-white dark:text-black px-6 py-2">Our Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Mentorship", color: "bg-[#00FFFF]", icon: Users },
            { title: "Incubation", color: "bg-[#00FFFF]", icon: Zap },
            { title: "Grants", color: "bg-[#00FF00]", icon: Trophy },
            { title: "Training", color: "bg-[#FF00FF]", icon: Lightbulb }
          ].map((item, i) => (
            <GlassCard key={i} className={`${item.color} p-8`}>
              <div className="w-14 h-14 bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <item.icon size={28} />
              </div>
              <h4 className="text-2xl font-black mb-2">{item.title}</h4>
              <p className="font-bold text-sm leading-tight">Elite guidance and resources for the next generation of CEOs.</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Dynamic Recent Highlights Section */}
      <section className="px-6 max-w-7xl mx-auto pb-32">
        <div className="flex items-center gap-6 mb-16">
          <div className="p-4 bg-[#FF00FF] border-[4px] rounded-[20px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <Camera size={32} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Recent Highlights.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {highlightsList.map((item, i) => (
            <GlassCard 
              key={i} 
              className={`p-0 overflow-hidden border-black dark:border-white flex flex-col transition-transform duration-300 ${item.rotate} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]`}
            >
              <div className="h-64 border-b-[4px] border-black dark:border-white">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover md:grayscale md:hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className={`p-8 ${item.color} flex-grow flex flex-col justify-center`}>
                <h3 className="text-2xl font-black mb-3 uppercase leading-none">{item.title}</h3>
                <p className="font-black text-xs uppercase leading-tight opacity-80">{item.description}</p>
                <div className="mt-6 pt-4 border-t-[2px] border-black dark:border-white/20 flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-black dark:bg-white border-[2px] border-black dark:border-white"></div>
                   <span className="text-[10px] font-black uppercase">Activity Log #00{i+1}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;