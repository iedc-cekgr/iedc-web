import React, { useState, useEffect } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { formatImageUrl } from '../constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import EventRegistrationModal from '../components/EventRegistrationModal';

interface EventsProps {
  onNavigate: (path: string) => void;
}

const Events: React.FC<EventsProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Online' | 'Offline'>('All');
  
  // Registration Modal State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id
      })) as unknown as Event[];
      
      eventsData.sort((a, b) => b.id - a.id);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return <div className="pt-40 px-6 max-w-5xl mx-auto pb-20 text-center font-bold text-2xl">Loading Events...</div>;
  }

  const filteredEvents = events.filter(event => {
    if (activeTab === 'All') return true;
    return event.mode === activeTab || (!event.mode && activeTab === 'Offline');
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
    if (dtStr.includes('T') && dtStr.length === 16) {
      // It's a datetime-local string (YYYY-MM-DDTHH:mm)
      return new Date(dtStr);
    }
    if (dtStr.includes('T')) {
      // Legacy string splitting logic, just in case
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
    // 1. Check if explicitly disabled for website forms
    if (event.eventType === 'website-form' && event.isRegistrationEnabled === false) {
      return { status: 'closed', message: 'Registrations Closed' };
    }

    // 2. Check participant limits
    if (event.maxParticipants && event.currentParticipants !== undefined && event.currentParticipants >= event.maxParticipants) {
      return { status: 'closed', message: 'Sold Out' };
    }

    const now = new Date();
    
    // 3. Time bounds check (for all types if provided)
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
    
    // Legacy fallback
    if (!event.eventType && !event.registrationLink) {
      return { status: 'closed', message: 'Registrations Closed' };
    }

    return { status: 'open', message: event.registrationButtonText || 'Register Now' };
  };

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="border-l-[12px] border-black dark:border-white pl-8 mb-12">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter">THE FEED.</h1>
        <p className="text-2xl font-black uppercase text-pink-600 bg-black dark:bg-white text-white dark:text-black inline-block px-4 py-1 mt-2 shadow-[6px_6px_0px_0px_rgba(236,72,153,1)]">Events that matter.</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-16">
        {['All', 'Online', 'Offline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-8 py-3 text-xl font-black uppercase border-[3px] rounded-[10px] border-black dark:border-white transition-all ${
              activeTab === tab 
                ? 'bg-[#FFDE03] text-black dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] translate-x-[-2px] translate-y-[-2px]' 
                : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 hover:text-black dark:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredEvents.map((event) => (
          <GlassCard key={event.id} className="p-0 border-black dark:border-white flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="h-56 border-b-[4px] border-black dark:border-white relative overflow-hidden bg-gray-100">
              <img src={formatImageUrl(event.image)} alt={event.title} className="w-full h-full object-cover md:grayscale md:group-hover:grayscale-0 transition-all duration-500" />
              <div className="absolute top-4 left-4 bg-[#00FFFF] border-[3px] border-black dark:border-white px-4 py-1 font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                {event.type}
              </div>
              <div className="absolute top-4 right-4 bg-white dark:bg-slate-900 border-[3px] border-black dark:border-white px-3 py-1 font-black text-xs uppercase flex items-center gap-2">
                {event.mode === 'Online' ? <ExternalLink size={14} /> : <MapPin size={14} />}
                {event.mode || 'Offline'}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow justify-between bg-white dark:bg-slate-900">
              <div className="space-y-4 mb-8">
                <div className="font-black text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest space-y-1">
                  {event.startDateTime ? (
                    <>
                      <p className="text-black dark:text-white">START: {formatDateTime(event.startDateTime)}</p>
                      {event.endDateTime && <p>END: {formatDateTime(event.endDateTime)}</p>}
                    </>
                  ) : (
                    <p>{event.date}</p>
                  )}
                </div>
                <h3 className="text-3xl font-black uppercase leading-none">{event.title}</h3>
                <p className="font-bold text-gray-700 leading-tight">{event.description}</p>
                {event.maxParticipants && event.currentParticipants !== undefined && (
                   <p className="text-xs font-bold text-pink-600 uppercase bg-pink-100 inline-block px-2 py-1 rounded">
                     {event.maxParticipants - event.currentParticipants} spots left
                   </p>
                )}
              </div>
              
              <div className="flex items-center justify-between border-t-[4px] border-black dark:border-white pt-6 mt-auto">
                 {(() => {
                   const regStatus = getRegistrationStatus(event);
                   if (regStatus.status === 'open') {
                     // Google Form or External Link
                     if (event.eventType === 'google-form' || (!event.eventType && event.registrationLink && !event.registrationLink.startsWith('/'))) {
                       return (
                         <a 
                           href={event.googleFormLink || event.registrationLink} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="w-full text-center bg-[#FF00FF] text-white border-[3px] border-black dark:border-white font-black py-4 px-6 uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                         >
                           {regStatus.message} <ExternalLink size={20} />
                         </a>
                       );
                     }
                     
                     // Internal Page Navigation (Legacy)
                     if (!event.eventType && event.registrationLink?.startsWith('/')) {
                       return (
                         <button 
                           onClick={() => onNavigate(event.registrationLink!)}
                           className="w-full text-center bg-[#FF00FF] text-white border-[3px] border-black dark:border-white font-black py-4 px-6 uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                         >
                           {regStatus.message}
                         </button>
                       );
                     }
                     
                     // Website Form (Modal)
                     return (
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="w-full text-center bg-[#FF00FF] text-white border-[3px] border-black dark:border-white font-black py-4 px-6 uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                        >
                          {regStatus.message}
                        </button>
                      );
                   } else {
                     return (
                       <div className="w-full text-center bg-gray-200 text-gray-500 dark:text-gray-400 border-[3px] border-gray-300 font-black py-4 px-6 uppercase text-lg cursor-not-allowed">
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
          <div className="col-span-full py-20 text-center border-[4px] border-black dark:border-white border-dashed">
            <h3 className="text-3xl font-black uppercase text-gray-400">No {activeTab !== 'All' ? activeTab : ''} Events Found</h3>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventRegistrationModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => {
            fetchEvents(); // Refresh data to update participant counts
          }}
        />
      )}
    </div>
  );
};

export default Events;