import React from 'react';
import { ArrowRight, Lightbulb, Zap, Users, Trophy, Camera } from 'lucide-react';
import GlassCard from '../components/GlassCard';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const highlights = [
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

      {/* Recent Highlights Section */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6 mb-16">
          <div className="p-4 bg-[#FF00FF] border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Camera size={32} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Recent Highlights.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {highlights.map((item, i) => (
            <GlassCard 
              key={i} 
              className={`p-0 overflow-hidden border-black flex flex-col transition-transform duration-300 ${item.rotate} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="h-64 border-b-[4px] border-black">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className={`p-8 ${item.color} flex-grow flex flex-col justify-center`}>
                <h3 className="text-2xl font-black mb-3 uppercase leading-none">{item.title}</h3>
                <p className="font-black text-xs uppercase leading-tight opacity-80">{item.description}</p>
                <div className="mt-6 pt-4 border-t-[2px] border-black/20 flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-black border-[2px] border-black"></div>
                   <span className="text-[10px] font-black uppercase">Activity Log #00{i+1}</span>
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