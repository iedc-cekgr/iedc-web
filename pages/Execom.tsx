import React, { useState, useEffect } from 'react';
import { Linkedin, Twitter, Github, Instagram, User, ArrowLeft, Star, Mail, Globe } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { formatImageUrl } from '../constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ExecomMember } from '../types';



const ConcentricCircles = () => (
  <div className="absolute -bottom-40 -left-40 md:-bottom-20 md:-left-20 pointer-events-none opacity-[0.03] dark:opacity-10 z-0 scale-150">
    <svg width="400" height="400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
      <circle cx="50" cy="50" r="10" />
      <circle cx="50" cy="50" r="20" />
      <circle cx="50" cy="50" r="30" />
      <circle cx="50" cy="50" r="40" />
      <circle cx="50" cy="50" r="50" />
      <circle cx="50" cy="50" r="60" />
    </svg>
  </div>
);

const SocialIcon = ({ Icon, href }: { Icon: any, href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] transition-shadow">
    <Icon className="w-5 h-5 text-black dark:text-white" />
  </a>
);

const ExecomMemberDetail: React.FC<{ member: ExecomMember; onBack: () => void }> = ({ member, onBack }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const names = member.name.trim().split(' ');
  const firstName = names[0];
  const lastName = names.slice(1).join(' ');

  return (
    <div className="relative pt-32 px-6 max-w-7xl mx-auto min-h-screen pb-20 overflow-hidden text-black dark:text-white">
      <ConcentricCircles />

      <button 
        onClick={onBack} 
        className="relative z-10 mb-12 flex items-center gap-3 text-sm font-black uppercase bg-white dark:bg-slate-900 text-black dark:text-white border-2 border-black dark:border-white rounded-full px-6 py-2 shadow-[4px_4px_0px_0px_#FACC15] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FACC15] transition-all animate-in slide-in-from-top-10 fade-in duration-500"
      >
        <ArrowLeft size={18} /> Back to Board
      </button>

      <div className="relative z-10 grid lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24 items-center pl-6 md:pl-10">
        {/* Left Side: Image */}
        <div className="relative group animate-in slide-in-from-left-10 fade-in duration-700 mt-4 md:mt-0">
          
          {/* Yellow solid background block */}
          <div className="absolute inset-0 bg-[#FACC15] rounded-[2rem] md:rounded-[3rem] translate-x-[-1.5rem] translate-y-[2rem] md:translate-x-[-2rem] md:translate-y-[3rem] z-0 transition-transform duration-500"></div>
          
          {/* Dot grid decoration */}
          <div className="absolute -top-6 -right-6 md:-top-10 md:-right-10 w-24 h-24 md:w-32 md:h-32 bg-[radial-gradient(#FACC15_2px,transparent_2px)] [background-size:12px_12px] md:[background-size:16px_16px] z-0"></div>
          
          {/* Main Image Container */}
          <div className="relative z-20 aspect-[4/5] border-[6px] md:border-[8px] border-white dark:border-slate-900 rounded-[2rem] md:rounded-[3rem] bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {!imgError ? (
              <img 
                src={formatImageUrl(member.image)} 
                onError={() => setImgError(true)}
                className="w-full h-full object-cover grayscale transition-all duration-700 hover:grayscale-0 hover:scale-105"
              />
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f0f0] dark:bg-slate-800 text-black dark:text-white p-4 text-center">
                 <User size={120} className="mb-4 opacity-20" />
                 <span className="font-black text-6xl opacity-10">{firstName[0]}</span>
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="py-4 animate-in slide-in-from-right-10 fade-in duration-700 delay-150 fill-mode-both">
          <div className="mb-6">
            <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black uppercase leading-[0.9] tracking-tighter break-words">
              <span className="block">{firstName}</span>
              <span className="block text-[#FACC15]">{lastName}</span>
            </h1>
          </div>
          
          {/* Divider */}
          <div className="flex h-1.5 md:h-2 w-32 mb-8 md:mb-12">
            <div className="w-1/2 bg-black dark:bg-white"></div>
            <div className="w-1/2 bg-[#FACC15]"></div>
          </div>

          {/* Role Pill */}
          <div className="mb-12 md:mb-16">
            <div className="inline-flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-4 md:px-5 py-2.5 rounded-lg md:rounded-xl">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#FACC15]">
                <Star className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
              </div>
              <span className="font-bold text-xs md:text-sm uppercase tracking-widest">
                {member.profileRole || member.role}
              </span>
            </div>
          </div>

          {/* Connect Section */}
          <div className="mt-8">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
              CONNECT <span className="w-2 h-2 rounded-full bg-[#FACC15]"></span>
              <span className="flex-1 max-w-[150px] h-[1px] bg-gray-200 dark:bg-gray-800"></span>
            </h3>
            
            <div className="flex flex-wrap gap-4">
               {member.socials.linkedin && <SocialIcon Icon={Linkedin} href={member.socials.linkedin} />}
               {member.socials.github && <SocialIcon Icon={Github} href={member.socials.github} />}
               {member.socials.instagram && <SocialIcon Icon={Instagram} href={member.socials.instagram} />}
               {member.socials.twitter && <SocialIcon Icon={Twitter} href={member.socials.twitter} />}
               {member.socials.email && <SocialIcon Icon={Mail} href={member.socials.email.includes('@') && !member.socials.email.startsWith('mailto:') ? `mailto:${member.socials.email}` : member.socials.email} />}
               {member.socials.portfolio && <SocialIcon Icon={Globe} href={member.socials.portfolio} />}
               {!member.socials.linkedin && !member.socials.github && !member.socials.twitter && !member.socials.instagram && !member.socials.email && !member.socials.portfolio && (
                 <p className="text-gray-400 italic text-sm">No social links provided.</p>
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