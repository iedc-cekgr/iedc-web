import React, { useState, useEffect } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { formatImageUrl } from '../constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Online' | 'Offline'>('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          docId: doc.id
        })) as unknown as Event[];
        
        // Sort by ID descending (newest first)
        eventsData.sort((a, b) => b.id - a.id);
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <div className="pt-40 px-6 max-w-5xl mx-auto pb-20 text-center font-bold text-2xl">Loading Events...</div>;
  }

  const filteredEvents = events.filter(event => {
    if (activeTab === 'All') return true;
    return event.mode === activeTab || (!event.mode && activeTab === 'Offline'); // Default legacy events to Offline
  });

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const parseDateTime = (dtStr?: string) => {
    if (!dtStr) return null;
    if (dtStr.includes('T')) {
      const [d, t] = dtStr.split('T');
      const [y, m, day] = d.split('-');
      const [hr, min] = t.split(':');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(day), parseInt(hr), parseInt(min));
    }
    return new Date(dtStr);
  };

  const getRegistrationStatus = (event: Event) => {
    if (!event.registrationLink) return { status: 'closed', message: 'Registrations Closed' };
    
    const now = new Date();
    const start = parseDateTime(event.startDateTime);
    const end = parseDateTime(event.endDateTime);
    
    if (start && start > now) {
      return { status: 'not_started', message: 'Not Started Yet' };
    }
    if (end && end < now) {
      return { status: 'ended', message: 'Registrations Ended' };
    }
    
    return { status: 'open', message: event.registrationButtonText || 'Register Now' };
  };

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="border-l-[12px] border-black pl-8 mb-12">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter">THE FEED.</h1>
        <p className="text-2xl font-black uppercase text-pink-600 bg-black text-white inline-block px-4 py-1 mt-2 shadow-[6px_6px_0px_0px_rgba(236,72,153,1)]">Events that matter.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-4 mb-16">
        {['All', 'Online', 'Offline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-8 py-3 text-xl font-black uppercase border-[3px] border-black transition-all ${
              activeTab === tab 
                ? 'bg-[#FFDE03] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredEvents.map((event) => (
          <GlassCard key={event.id} className="p-0 border-black flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="h-56 border-b-[4px] border-black relative overflow-hidden bg-gray-100">
              <img src={formatImageUrl(event.image)} alt={event.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              {/* Event Type Badge */}
              <div className="absolute top-4 left-4 bg-[#00FFFF] border-[3px] border-black px-4 py-1 font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {event.type}
              </div>
              {/* Mode Badge */}
              <div className="absolute top-4 right-4 bg-white border-[3px] border-black px-3 py-1 font-black text-xs uppercase flex items-center gap-2">
                {event.mode === 'Online' ? <ExternalLink size={14} /> : <MapPin size={14} />}
                {event.mode || 'Offline'}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow justify-between bg-white">
              <div className="space-y-4 mb-8">
                <div className="font-black text-sm text-gray-500 uppercase tracking-widest space-y-1">
                  {event.startDateTime ? (
                    <>
                      <p className="text-black">START: {formatDateTime(event.startDateTime)}</p>
                      {event.endDateTime && <p>END: {formatDateTime(event.endDateTime)}</p>}
                    </>
                  ) : (
                    <p>{event.date}</p>
                  )}
                </div>
                <h3 className="text-3xl font-black uppercase leading-none">{event.title}</h3>
                <p className="font-bold text-gray-700 leading-tight">{event.description}</p>
              </div>
              
              <div className="flex items-center justify-between border-t-[4px] border-black pt-6 mt-auto">
                 {(() => {
                   const regStatus = getRegistrationStatus(event);
                   if (regStatus.status === 'open') {
                     return (
                       <a 
                         href={event.registrationLink} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="w-full text-center bg-[#FF00FF] text-white border-[3px] border-black font-black py-4 px-6 uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                       >
                         {regStatus.message} <ExternalLink size={20} />
                       </a>
                     );
                   } else {
                     return (
                       <div className="w-full text-center bg-gray-200 text-gray-500 border-[3px] border-gray-300 font-black py-4 px-6 uppercase text-lg cursor-not-allowed">
                         {regStatus.message}
                       </div>
                     );
                   }
                 })()}
              </div>
            </div>
          </GlassCard>
        ))}
        {filteredEvents.length === 0 && (
          <div className="col-span-full py-20 text-center border-[4px] border-black border-dashed">
            <h3 className="text-3xl font-black uppercase text-gray-400">No {activeTab !== 'All' ? activeTab : ''} Events Found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;