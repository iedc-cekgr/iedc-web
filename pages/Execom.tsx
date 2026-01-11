import React, { useState } from 'react';
import { Linkedin, Twitter, Github, Instagram, User } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { EXECOM_MEMBERS, formatImageUrl } from '../constants';

const ExecomMemberCard: React.FC<{ member: any }> = ({ member }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <GlassCard className="p-0 border-black overflow-hidden group">
      <div className="relative aspect-square border-b-[4px] border-black overflow-hidden bg-gray-100">
        {!imgError ? (
          <img 
            src={formatImageUrl(member.image)} 
            alt={member.name} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f0f0] text-black p-4 text-center">
            <User size={64} className="mb-4 opacity-20" />
            <span className="font-black text-4xl opacity-10">{member.name.split(' ').map((n: string) => n[0]).join('')}</span>
            <p className="text-[10px] font-black uppercase mt-4 opacity-40">Image not found</p>
          </div>
        )}
        
        <div className="absolute inset-0 bg-[#FFDE03]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
           {member.socials.linkedin && (
              <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-black border-[3px] border-black flex items-center justify-center hover:bg-white group/icon transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Linkedin className="text-white group-hover/icon:text-black" />
              </a>
           )}
           {member.socials.github && (
              <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-black border-[3px] border-black flex items-center justify-center hover:bg-white group/icon transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Github className="text-white group-hover/icon:text-black" />
              </a>
           )}
        </div>
      </div>
      <div className="p-8 bg-white">
        <h3 className="text-3xl font-black uppercase mb-1">{member.name}</h3>
        <p className="text-lg font-black text-blue-600 uppercase tracking-widest">{member.role}</p>
      </div>
    </GlassCard>
  );
};

const Execom: React.FC = () => {
  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20">
      <div className="mb-20">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">THE BOARD.</h1>
        <p className="text-2xl font-black text-white bg-black inline-block px-4 py-1 uppercase">Executing Innovation daily.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {EXECOM_MEMBERS.map((member) => (
          <ExecomMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
};

export default Execom;