import React from 'react';
import { Calendar } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { EVENTS, formatImageUrl } from '../constants';

const Events: React.FC = () => {
  return (
    <div className="pt-40 px-6 max-w-5xl mx-auto pb-20 space-y-16">
      <div className="border-l-[12px] border-black pl-8 mb-20">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter">THE FEED.</h1>
        <p className="text-2xl font-black uppercase text-pink-600">Events that matter.</p>
      </div>

      <div className="space-y-16">
        {EVENTS.map((event) => (
          <div key={event.id} className="relative">
            <GlassCard className="p-0 border-black flex flex-col md:flex-row shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="md:w-1/3 h-64 md:h-auto border-b-[4px] md:border-b-0 md:border-r-[4px] border-black">
                <img src={formatImageUrl(event.image)} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="md:w-2/3 p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-block px-4 py-1 bg-[#FFDE03] border-[3px] border-black font-black uppercase text-sm">
                    {event.type} — {event.date}
                  </div>
                  <h3 className="text-4xl font-black uppercase leading-none">{event.title}</h3>
                  <p className="text-xl font-bold leading-tight">{event.description}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-6 border-t-[4px] border-black pt-8">
                   <div className="flex gap-4 font-black text-sm uppercase">
                      <span className="flex items-center gap-1"><Calendar size={18} /> 10:00 - 16:00</span>
                   </div>
                   {/* Join button removed as requested */}
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;