import React, { useState } from 'react';
import { Rocket, History, Award, Users, Trophy, Lightbulb, Zap, Medal } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { PROJECTS, TIMELINE_EVENTS, ACHIEVEMENTS, PAST_LEADERS, formatImageUrl } from '../constants';

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', 'Hardware', 'Software', 'Startup', 'Social'];

  const filteredProjects = filter === 'All' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === filter);

  const AchievementIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'Trophy': return <Trophy className="text-black" size={32} />;
      case 'Lightbulb': return <Lightbulb className="text-black" size={32} />;
      case 'Zap': return <Zap className="text-black" size={32} />;
      default: return <Award className="text-black" size={32} />;
    }
  };

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 space-y-32">
      {/* Header */}
      <div className="flex flex-col items-start gap-8 border-b-[8px] border-black pb-12">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none">LEGACY.</h1>
        <div className="inline-block px-6 py-2 bg-[#FFDE03] border-[4px] border-black text-2xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Decades of Innovation.
        </div>
      </div>

      {/* Timeline Section */}
      <section className="space-y-16">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-black text-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,255,255,1)]">
            <History size={32} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase">Our Journey</h2>
        </div>

        <div className="relative border-l-[6px] border-black ml-4 md:ml-12 pl-12 space-y-12">
          {TIMELINE_EVENTS.map((event, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[61px] top-0 w-12 h-12 bg-[#FF00FF] border-[4px] border-black flex items-center justify-center font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {event.year.slice(-2)}
              </div>
              <GlassCard className="p-8 bg-white max-w-2xl">
                <h3 className="text-3xl font-black mb-2 uppercase">{event.year}: {event.title}</h3>
                <p className="text-lg font-bold text-gray-700">{event.description}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      </section>

      {/* Hall of Fame Section with Images */}
      <section className="space-y-16">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-[#00FF00] text-black border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Medal size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter">Hall of Fame</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {ACHIEVEMENTS.map((ach) => (
            <div 
              key={ach.id} 
              className="bg-white border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group flex flex-col overflow-hidden"
            >
              {/* Achievement Photo */}
              <div className="relative h-64 bg-gray-100 border-b-[4px] border-black overflow-hidden">
                {ach.image ? (
                  <img 
                    src={formatImageUrl(ach.image)} 
                    alt={ach.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Medal size={64} className="opacity-10" />
                  </div>
                )}
                
                {/* Icon Box Overlay */}
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-white border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                  <AchievementIcon type={ach.icon} />
                </div>
              </div>

              <div className="p-8 flex flex-col items-center text-center space-y-6">
                {/* Year Badge */}
                <div className="bg-black text-white px-6 py-1 text-xl font-black">
                  {ach.year}
                </div>

                {/* Title and Description */}
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase leading-tight">
                    {ach.title}
                  </h3>
                  <p className="text-sm font-black uppercase leading-snug text-black opacity-80">
                    {ach.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Leaders Section */}
      <section className="space-y-16">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-[#FFDE03] text-black border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Users size={32} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase">The Pioneers</h2>
        </div>

        <div className="space-y-16">
          {PAST_LEADERS.map((leader, i) => (
            <div key={i} className="space-y-8">
              <div className="inline-block px-8 py-2 bg-black text-white border-[4px] border-black text-3xl font-black skew-x-[-10deg]">
                TENURE {leader.year}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nodal Officer Card */}
                <GlassCard className="p-0 border-black flex overflow-hidden group">
                  <div className="w-1/3 aspect-square border-r-[4px] border-black bg-gray-200">
                    <img 
                      src={formatImageUrl(leader.nodalOfficerImage)} 
                      alt={leader.nodalOfficer} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <div className="w-2/3 p-8 flex flex-col justify-center bg-white">
                    <span className="text-xs font-black uppercase bg-[#00FFFF] border-[2px] border-black px-2 py-0.5 inline-block w-fit mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Nodal Officer</span>
                    <h3 className="text-2xl font-black uppercase leading-tight">{leader.nodalOfficer}</h3>
                  </div>
                </GlassCard>

                {/* CEO Card */}
                <GlassCard className="p-0 border-black flex overflow-hidden group">
                  <div className="w-1/3 aspect-square border-r-[4px] border-black bg-gray-200">
                    <img 
                      src={formatImageUrl(leader.ceoImage)} 
                      alt={leader.ceo} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <div className="w-2/3 p-8 flex flex-col justify-center bg-white">
                    <span className="text-xs font-black uppercase bg-[#FF00FF] text-white border-[2px] border-black px-2 py-0.5 inline-block w-fit mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">CEO</span>
                    <h3 className="text-2xl font-black uppercase leading-tight">{leader.ceo}</h3>
                  </div>
                </GlassCard>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section className="space-y-16">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[#FF00FF] text-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Rocket size={32} />
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">Student Creations</h2>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 border-[3px] border-black text-sm font-black uppercase transition-all
                  ${filter === cat 
                    ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' 
                    : 'bg-[#00FFFF] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFDE03]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {filteredProjects.map((project) => (
            <GlassCard key={project.id} className="p-0 border-black flex flex-col">
              <div className="relative h-72 border-b-[4px] border-black overflow-hidden">
                <img 
                  src={formatImageUrl(project.image)} 
                  alt={project.title} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-4 py-1 border-[3px] border-black bg-white font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-8 flex-1 space-y-6">
                <h3 className="text-3xl font-black uppercase leading-none">{project.title}</h3>
                <p className="text-lg font-bold leading-tight text-gray-800">
                  {project.description}
                </p>
                <div className="flex items-center justify-between pt-6 border-t-[3px] border-black/20">
                  <div className="flex -space-x-3">
                    {project.team.map((m, i) => (
                      <div key={i} className="w-10 h-10 border-[3px] border-black bg-[#FFDE03] flex items-center justify-center font-black text-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {m[0]}
                      </div>
                    ))}
                  </div>
                  <span className={`px-4 py-1 border-[3px] border-black font-black uppercase text-[10px]
                    ${project.status === 'Completed' ? 'bg-[#00FF00]' : 'bg-[#FFDE03]'}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Projects;