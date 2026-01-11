
import React from 'react';
import { Target, Eye } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const About: React.FC = () => {
  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto space-y-32 pb-20">
      <div className="max-w-4xl border-b-[10px] border-black pb-12">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none mb-8">WHO WE ARE.</h1>
        <p className="text-2xl font-bold leading-tight uppercase">
          Innovation isn't a buzzword. It's our daily operation. We build, we fail, we iterate, we launch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <GlassCard className="p-12 bg-[#FFDE03] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <Target className="mb-8" size={48} />
          <h2 className="text-5xl font-black mb-6">MISSION.</h2>
          <p className="text-xl font-black leading-tight uppercase">
            To burn the conventional job-seeker mindset and replace it with a founder's spirit.
          </p>
        </GlassCard>

        <GlassCard className="p-12 bg-[#00FFFF] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <Eye className="mb-8" size={48} />
          <h2 className="text-5xl font-black mb-6">VISION.</h2>
          <p className="text-xl font-black leading-tight uppercase">
            A campus that functions as a factory for high-growth, high-tech startups.
          </p>
        </GlassCard>
      </div>

      <div className="space-y-16">
        <div className="p-12 border-[4px] border-black bg-black text-white shadow-[12px_12px_0px_0px_rgba(255,0,255,1)]">
          <h2 className="text-5xl font-black mb-8">OUR CORE.</h2>
          <p className="text-xl font-bold leading-relaxed uppercase">
            IEDC CE Kidangoor acts as a catalyst for creative minds. We bridge the gap between academic theory and entrepreneurial reality. Every student has the potential to be a maker—we provide the environment to realize it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
