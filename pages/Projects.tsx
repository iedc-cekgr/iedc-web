import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { PROJECTS, formatImageUrl } from '../constants';

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', 'Hardware', 'Software', 'Startup', 'Social'];

  const filteredProjects = filter === 'All' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === filter);

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-20 border-b-[8px] border-black pb-12">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter">PROJECTS.</h1>
          <p className="text-2xl font-bold max-w-md uppercase">Code. Solder. Pitch. Repeat.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-3 border-[4px] border-black text-lg font-black uppercase transition-all
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
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-4 py-1 border-[3px] border-black bg-white font-black uppercase text-xs">
                  {project.category}
                </span>
                <span className={`px-4 py-1 border-[3px] border-black font-black uppercase text-xs
                  ${project.status === 'Completed' ? 'bg-[#00FF00]' : 'bg-[#FFDE03]'}`}>
                  {project.status}
                </span>
              </div>
            </div>
            <div className="p-10 flex-1 space-y-6">
              <h3 className="text-4xl font-black uppercase leading-none">{project.title}</h3>
              <p className="text-lg font-bold leading-tight text-gray-800">
                {project.description}
              </p>
              <div className="flex items-center justify-between pt-6 border-t-[4px] border-black">
                <div className="flex -space-x-3">
                  {project.team.map((m, i) => (
                    <div key={i} className="w-12 h-12 border-[3px] border-black bg-[#FF00FF] flex items-center justify-center font-black text-white text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {m[0]}
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-black text-white font-black uppercase text-sm hover:bg-blue-600 transition-colors">
                  VIEW CASE <Rocket size={18} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default Projects;