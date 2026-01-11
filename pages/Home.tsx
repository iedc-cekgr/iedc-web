import React from 'react';
import { ArrowRight, Lightbulb, Zap, Users, Trophy, Camera } from 'lucide-react';
import GlassCard from '../components/GlassCard';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const moments = [
    {
      title: "Industrial Visit 2024",
      description: "Exploring the tech giants at Bangalore.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
      color: "bg-[#00FF00]",
      rotate: "hover:-rotate-2"
    },
    {
      title: "Startup Workshop",
      description: "Hands-on session with industry veterans.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
      color: "bg-[#FF00FF]",
      rotate: "hover:rotate-2"
    },
    {
      title: "Hackathon Night",
      description: "48 hours of pure creation and caffeine.",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
      color: "bg-[#00FFFF]",
      rotate: "hover:-rotate-1"
    },
    {
      title: "Community Meet",
      description: "The engine room of the entrepreneur cell.",
      image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=800&auto=format&fit=crop",
      color: "bg-[#FFDE03]",
      rotate: "hover:rotate-1"
    }
  ];

  return (
    <div className="pt-32 space-y-24">
      {/* Hero Section */}
      <section className="px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block px-4 py-1 border-[3px] border-black bg-[#00FFFF] font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Building The Future
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
            IDEAS <br />
            <span className="bg-[#FFDE03] px-2 border-x-[6px] border-black">DEMAND</span> <br />
            ACTION.
          </h1>
          <p className="text-xl font-bold text-black border-l-[6px] border-black pl-6 max-w-lg leading-tight">
            The Innovation and Entrepreneurship Development Cell at CE Kidangoor. No fluff. Just raw creation and startups.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('/about')}
              className="px-8 py-5 bg-black text-white border-[4px] border-black text-xl font-black shadow-[8px_8px_0px_0px_rgba(255,222,3,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3"
            >
              LEARN MORE <ArrowRight size={24} />
            </button>
            <button 
              onClick={() => onNavigate('/execom')}
              className="px-8 py-5 bg-white text-black border-[4px] border-black text-xl font-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FF00FF] hover:text-white transition-all"
            >
              MEET THE BOARD
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10">
            <GlassCard className="bg-[#FFDE03] p-12 hover:rotate-2">
              <div className="w-24 h-24 bg-white border-[4px] border-black flex items-center justify-center mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <Lightbulb size={48} />
              </div>
              <h3 className="text-4xl font-black mb-4">WE START UP.</h3>
              <p className="font-bold text-lg mb-8">We transform engineering students into founders. If you have an idea, we have the tools.</p>
              
              <div className="grid grid-cols-2 gap-6 border-t-[4px] border-black pt-8">
                <div className="text-center border-r-[4px] border-black">
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
          <div className="absolute -top-6 -right-6 w-full h-full bg-[#00FFFF] border-[4px] border-black -z-10"></div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl mb-16 inline-block bg-black text-white px-6 py-2">Our Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Mentorship", color: "bg-[#00FFFF]", icon: Users },
            { title: "Incubation", color: "bg-[#FFDE03]", icon: Zap },
            { title: "Grants", color: "bg-[#00FF00]", icon: Trophy },
            { title: "Training", color: "bg-[#FF00FF]", icon: Lightbulb }
          ].map((item, i) => (
            <GlassCard key={i} className={`${item.color} p-8`}>
              <div className="w-14 h-14 bg-white border-[3px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <item.icon size={28} />
              </div>
              <h4 className="text-2xl font-black mb-2">{item.title}</h4>
              <p className="font-bold text-sm leading-tight">Elite guidance and resources for the next generation of CEOs.</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Moments / Gallery Section */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6 mb-16">
          <div className="p-4 bg-[#FF00FF] border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Camera size={32} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black">FIELD TRIPS & VIBES.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {moments.map((moment, i) => (
            <GlassCard 
              key={i} 
              className={`p-0 overflow-hidden border-black flex flex-col md:flex-row transition-transform duration-300 ${moment.rotate}`}
            >
              <div className="md:w-1/2 h-64 md:h-auto border-b-[4px] md:border-b-0 md:border-r-[4px] border-black">
                <img 
                  src={moment.image} 
                  alt={moment.title} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className={`md:w-1/2 p-8 ${moment.color} flex flex-col justify-center`}>
                <h3 className="text-3xl font-black mb-4 uppercase leading-none">{moment.title}</h3>
                <p className="font-black text-sm uppercase leading-tight opacity-80">{moment.description}</p>
                <div className="mt-8 pt-6 border-t-[3px] border-black/20 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-black border-[2px] border-black"></div>
                   <span className="text-xs font-black uppercase">IEDC CEK SQUAD</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 max-w-7xl mx-auto pb-20">
        <div className="bg-black text-white border-[6px] border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,255,255,1)] flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-black leading-none">JOIN THE CELL.</h2>
            <p className="text-xl font-bold max-w-xl text-[#00FFFF]">The journey from student to entrepreneur starts with a single click. No excuses.</p>
          </div>
          <button className="px-12 py-6 bg-[#FFDE03] text-black border-[4px] border-black text-2xl font-black hover:scale-105 transition-transform">
            REGISTER NOW
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;