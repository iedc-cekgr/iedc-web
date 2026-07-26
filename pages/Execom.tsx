import React, { useState, useEffect } from 'react';
import { Linkedin, Twitter, Github, Instagram, User, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { formatImageUrl } from '../constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ExecomMember } from '../types';

const ExecomMemberDetail: React.FC<{ member: ExecomMember; onBack: () => void }> = ({ member, onBack }) => {
  const [imgError, setImgError] = useState(false);

  // Scroll to top when mounted
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20 overflow-hidden">
      <button 
        onClick={onBack} 
        className="mb-16 flex items-center gap-3 text-xl font-black uppercase tracking-wider hover:bg-black dark:bg-white hover:text-white dark:hover:text-black border-[4px] border-black dark:border-white px-6 py-2 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] animate-in slide-in-from-top-10 fade-in duration-500"
      >
        <ArrowLeft size={24} /> Back to Board
      </button>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24 items-center">
        {/* Left Side: Animated Image */}
        <div className="relative group animate-in slide-in-from-left-10 fade-in duration-700">
          {/* Decorative background shapes */}
          <div className="absolute inset-0 bg-[#FF00FF] translate-x-4 translate-y-4 border-[4px] border-black dark:border-white group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-500 ease-out z-0"></div>
          <div className="absolute inset-0 bg-[#00FFFF] translate-x-2 translate-y-2 border-[4px] border-black dark:border-white group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500 delay-75 ease-out z-10"></div>
          
          <div className="relative z-20 aspect-[4/5] border-[4px] border-black dark:border-white bg-gray-100 overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-none group-hover:translate-x-[8px] group-hover:translate-y-[8px] transition-all duration-500 bg-white">
            {!imgError ? (
              <img 
                src={formatImageUrl(member.image)} 
                onError={() => setImgError(true)}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              />
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f0f0] text-black dark:text-white p-4 text-center">
                 <User size={120} className="mb-4 opacity-20" />
                 <span className="font-black text-6xl opacity-10">{member.name.split(' ').map((n: string) => n[0]).join('')}</span>
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="py-4 animate-in slide-in-from-right-10 fade-in duration-700 delay-150 fill-mode-both">
          <div className="mb-8 space-y-6">
            <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black uppercase leading-[0.9] tracking-tighter break-words text-black dark:text-white">
              {member.name}
            </h1>
            <div className="inline-flex overflow-hidden border-[4px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all group">
              <span className="bg-[#FFDE03] text-black px-6 py-3 text-2xl md:text-3xl font-black uppercase tracking-widest group-hover:bg-[#FF00FF] group-hover:text-white transition-colors duration-300">
                {member.profileRole || member.role}
              </span>
            </div>
          </div>

          <div className="mt-16">
            <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-4 text-black dark:text-white">
              <span className="w-12 h-1 bg-black dark:bg-white"></span>
              Connect
            </h3>
            
            <div className="flex flex-wrap gap-6">
               {member.socials.linkedin && (
                  <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="relative group/link w-16 h-16 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white flex items-center justify-center transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[4px] hover:translate-y-[4px]">
                    <div className="absolute inset-0 bg-[#0077b5] scale-y-0 group-hover/link:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></div>
                    <Linkedin className="relative z-10 text-black dark:text-white group-hover/link:text-white w-8 h-8 group-hover/link:-rotate-12 transition-transform duration-300" />
                  </a>
               )}
               {member.socials.github && (
                  <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="relative group/link w-16 h-16 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white flex items-center justify-center transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[4px] hover:translate-y-[4px]">
                    <div className="absolute inset-0 bg-[#333] scale-y-0 group-hover/link:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></div>
                    <Github className="relative z-10 text-black dark:text-white group-hover/link:text-white w-8 h-8 group-hover/link:rotate-12 transition-transform duration-300" />
                  </a>
               )}
               {member.socials.twitter && (
                  <a href={member.socials.twitter} target="_blank" rel="noopener noreferrer" className="relative group/link w-16 h-16 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white flex items-center justify-center transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[4px] hover:translate-y-[4px]">
                    <div className="absolute inset-0 bg-[#1DA1F2] scale-y-0 group-hover/link:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></div>
                    <Twitter className="relative z-10 text-black dark:text-white group-hover/link:text-white w-8 h-8 group-hover/link:-rotate-12 transition-transform duration-300" />
                  </a>
               )}
               {member.socials.instagram && (
                  <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer" className="relative group/link w-16 h-16 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white flex items-center justify-center transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[4px] hover:translate-y-[4px]">
                    <div className="absolute inset-0 bg-[#E1306C] scale-y-0 group-hover/link:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></div>
                    <Instagram className="relative z-10 text-black dark:text-white group-hover/link:text-white w-8 h-8 group-hover/link:rotate-12 transition-transform duration-300" />
                  </a>
               )}
               {!member.socials.linkedin && !member.socials.github && !member.socials.twitter && !member.socials.instagram && (
                 <p className="text-gray-500 dark:text-gray-400 font-bold italic uppercase border-[4px] border-gray-200 border-dashed p-4 bg-gray-50 dark:bg-slate-800">No social links provided.</p>
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
      <GlassCard className="p-0 border-black dark:border-white overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
        <div className="relative aspect-square border-b-[4px] border-black dark:border-white overflow-hidden bg-gray-100">
          {!imgError ? (
            <img 
              src={formatImageUrl(member.image)} 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover md:grayscale md:group-hover:grayscale-0 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f0f0] text-black dark:text-white p-4 text-center">
              <User size={64} className="mb-4 opacity-20" />
              <span className="font-black text-4xl opacity-10">{member.name.split(' ').map((n: string) => n[0]).join('')}</span>
              <p className="text-[10px] font-black uppercase mt-4 opacity-40">Image not found</p>
            </div>
          )}
          
          <div className="absolute inset-0 bg-[#FFDE03]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <span className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-black uppercase text-xl border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
               View Profile <ArrowLeft className="rotate-180 w-5 h-5" />
             </span>
          </div>
        </div>
        <div className="p-8 bg-white dark:bg-slate-900 group-hover:bg-gray-50 transition-colors duration-300">
          <h3 className="text-3xl font-black uppercase mb-1">{member.name}</h3>
          <p className="text-lg font-black text-blue-600 uppercase tracking-widest">{member.role}</p>
        </div>
      </GlassCard>
    </div>
  );
};

interface ExecomProps {
  memberId?: string;
  onNavigate?: (path: string) => void;
}

const Execom: React.FC<ExecomProps> = ({ memberId, onNavigate }) => {
  const [selectedMember, setSelectedMember] = useState<ExecomMember | null>(null);
  const [members, setMembers] = useState<ExecomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'execom'));
        const membersData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          docId: doc.id
        })) as unknown as ExecomMember[];
        
        membersData.sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching execom members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      if (memberId) {
        const member = members.find(m => {
          if (m.id.toString() === memberId || m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === memberId || (m as any).docId === memberId) return true;
          
          const slugBase = m.role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const sameRoleMembers = members.filter(x => x.role === m.role);
          const index = sameRoleMembers.findIndex(x => x.id === m.id);
          const expectedSlug = index > 0 ? `${slugBase}-${index + 1}` : slugBase;
          
          return expectedSlug === memberId;
        });
        if (member) setSelectedMember(member);
      } else {
        setSelectedMember(null);
      }
    }
  }, [members, memberId]);

  if (selectedMember) {
    return <ExecomMemberDetail member={selectedMember} onBack={() => {
      if (onNavigate) {
        onNavigate('/execom');
      } else {
        setSelectedMember(null);
      }
    }} />;
  }

  if (loading) {
    return <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 text-center font-bold text-2xl">Loading Execom...</div>;
  }

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="mb-20">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">THE BOARD.</h1>
        <p className="text-2xl font-black text-white bg-black dark:bg-white inline-block px-4 py-1 uppercase">Executing Innovation daily.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {members.map((member) => (
          <ExecomMemberCard key={member.id} member={member} onClick={() => {
            if (onNavigate) {
              const slugBase = member.role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const sameRoleMembers = members.filter(x => x.role === member.role);
              const index = sameRoleMembers.findIndex(x => x.id === member.id);
              const slug = index > 0 ? `${slugBase}-${index + 1}` : slugBase;
              
              onNavigate(`/execom/${slug}`);
            } else {
              setSelectedMember(member);
            }
          }} />
        ))}
      </div>
    </div>
  );
};

export default Execom;