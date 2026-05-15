import React, { useState, useEffect } from 'react';
import { Linkedin, Twitter, Github, Instagram, User, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { EXECOM_MEMBERS, formatImageUrl } from '../constants';
import { ExecomMember } from '../types';

const ExecomMemberDetail: React.FC<{ member: ExecomMember; onBack: () => void }> = ({ member, onBack }) => {
  const [imgError, setImgError] = useState(false);

  // Scroll to top when mounted
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="pt-40 px-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <button 
        onClick={onBack} 
        className="mb-12 flex items-center gap-3 text-xl font-black uppercase tracking-wider hover:bg-black hover:text-white border-[3px] border-black px-6 py-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
      >
        <ArrowLeft size={24} /> Back to Board
      </button>

      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div className="aspect-square border-[4px] border-black bg-gray-100 overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sticky top-32">
          {!imgError ? (
            <img 
              src={formatImageUrl(member.image)} 
              alt={member.name} 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f0f0] text-black p-4 text-center">
               <User size={120} className="mb-4 opacity-20" />
               <span className="font-black text-6xl opacity-10">{member.name.split(' ').map((n: string) => n[0]).join('')}</span>
             </div>
          )}
        </div>
        <div className="py-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase mb-4 leading-none">{member.name}</h1>
          <p className="inline-block text-2xl font-black text-white bg-blue-600 px-4 py-2 uppercase tracking-widest mb-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {member.role}
          </p>
          
          <div className="mb-12">
            <h3 className="text-2xl font-black uppercase tracking-widest mb-6 border-b-[4px] border-black pb-2 inline-block">Connect</h3>
            
            <div className="flex flex-wrap gap-6">
               {member.socials.linkedin && (
                  <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#0077b5] group/icon transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]">
                    <Linkedin className="text-black group-hover/icon:text-white w-8 h-8" />
                  </a>
               )}
               {member.socials.github && (
                  <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#333] group/icon transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]">
                    <Github className="text-black group-hover/icon:text-white w-8 h-8" />
                  </a>
               )}
               {member.socials.twitter && (
                  <a href={member.socials.twitter} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#1DA1F2] group/icon transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]">
                    <Twitter className="text-black group-hover/icon:text-white w-8 h-8" />
                  </a>
               )}
               {member.socials.instagram && (
                  <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#E1306C] group/icon transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]">
                    <Instagram className="text-black group-hover/icon:text-white w-8 h-8" />
                  </a>
               )}
               {!member.socials.linkedin && !member.socials.github && !member.socials.twitter && !member.socials.instagram && (
                 <p className="text-gray-500 font-bold italic uppercase border-[3px] border-gray-200 p-4 bg-gray-50">No social links provided.</p>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExecomMemberCard: React.FC<{ member: ExecomMember; onClick: () => void }> = ({ member, onClick }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div onClick={onClick} className="cursor-pointer">
      <GlassCard className="p-0 border-black overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
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
          
          <div className="absolute inset-0 bg-[#FFDE03]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <span className="bg-black text-white px-6 py-3 font-black uppercase text-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
               View Profile <ArrowLeft className="rotate-180 w-5 h-5" />
             </span>
          </div>
        </div>
        <div className="p-8 bg-white group-hover:bg-gray-50 transition-colors duration-300">
          <h3 className="text-3xl font-black uppercase mb-1">{member.name}</h3>
          <p className="text-lg font-black text-blue-600 uppercase tracking-widest">{member.role}</p>
        </div>
      </GlassCard>
    </div>
  );
};

const Execom: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<ExecomMember | null>(null);

  if (selectedMember) {
    return <ExecomMemberDetail member={selectedMember} onBack={() => setSelectedMember(null)} />;
  }

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="mb-20">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">THE BOARD.</h1>
        <p className="text-2xl font-black text-white bg-black inline-block px-4 py-1 uppercase">Executing Innovation daily.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {EXECOM_MEMBERS.map((member) => (
          <ExecomMemberCard key={member.id} member={member} onClick={() => setSelectedMember(member)} />
        ))}
      </div>
    </div>
  );
};

export default Execom;