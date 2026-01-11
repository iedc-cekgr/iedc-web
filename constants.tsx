import { ExecomMember, Event, Project } from './types';

/**
 * Utility to convert Google Drive sharing links to direct image links
 * and handle other image path formatting.
 */
export const formatImageUrl = (url: string) => {
  if (!url) return '';
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
  }
  return url;
};

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Execom', path: '/execom' },
  { label: 'Projects', path: '/projects' },
  { label: 'Events', path: '/events' },
];

export const EXECOM_MEMBERS: ExecomMember[] = [
  {
    id: 1,
    name: "Chinchu M",
    role: "Nodal Officer",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768152331/WhatsApp_Image_2026-01-11_at_22.55.07_jqfpym.jpg",
    socials: {}
  },
  {
    id: 2,
    name: "Jayalakshmi M",
    role: "CEO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768150968/WhatsApp_Image_2026-01-11_at_22.18.07_jb2ngr.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/jayalakshmi-m-" }
  },
  {
    id: 3,
    name: "Sebin Binoy",
    role: "COO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768152098/WhatsApp_Image_2026-01-11_at_22.50.53_bzucyx.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/sebin-binoy?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
  },
  {
    id: 4,
    name: "Amil Mether",
    role: "CTO",
    image: "https://media.licdn.com/dms/image/v2/D5603AQHSiINi-xhmng/profile-displayphoto-scale_400_400/B56Zkj8MxRJ8Ag-/0/1757244610196?e=2147483647&v=beta&t=iwgYt5GaDhNA85rEuVlId9haeXd5IlGIT-_H8-iGFbg",
    socials: { linkedin: "https://www.linkedin.com/in/amilmether/" }
  },
  {
    id: 5,
    name: "Agnivesh S",
    role: "CCO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151740/WhatsApp_Image_2026-01-11_at_22.40.10_c6ye69.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/agnivesh-s-542086318" }
  },
  {
    id: 6,
    name: "Alen Jose",
    role: "CMO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151008/WhatsApp_Image_2026-01-11_at_22.21.49_izi2q3.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/alen-jose-438767370" }
  },
  {
    id: 7,
    name: "Madhav M Anish",
    role: "CSO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151008/WhatsApp_Image_2026-01-11_at_22.19.25_stmbot.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/madhav-m-anish-9a5a5731b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
  },
  {
    id: 8,
    name: "Navya S Nair",
    role: "CFO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768152164/WhatsApp_Image_2026-01-11_at_22.51.48_bprvqx.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/navya-s-nair-45079a321" }
  },
  {
    id: 9,
    name: "Arunima Sony",
    role: "WIE",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151741/WhatsApp_Image_2026-01-11_at_22.42.47_zku23q.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/arunima-sony" }
  },
  {
    id: 10,
    name: "Nandana Ashok",
    role: "ACTO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768152718/WhatsApp_Image_2026-01-11_at_22.43.14_hgpw42.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/nandana-ashok-a94714321" }
  },
  {
    id: 11,
    name: "S Sreenandan",
    role: "Documentation Lead",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151007/WhatsApp_Image_2026-01-11_at_22.19.16_yaddzl.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/s-sreenandan-6b480b28b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
  },
  {
    id: 12,
    name: "Deepak Suresh",
    role: "Research Lead",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151008/WhatsApp_Image_2026-01-11_at_22.20.51_gyqacp.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/deepak-suresh-11545218b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
  },
  {
    id: 13,
    name: "Ajay Krishnan AP",
    role: "Community Head",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151007/WhatsApp_Image_2026-01-11_at_22.19.52_tk8kq4.jpg",
    socials: {}
  },
  {
    id: 14,
    name: "Jeswin Joy",
    role: "ACSO",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151006/WhatsApp_Image_2026-01-11_at_22.18.25_o13nmx.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/jeswin-joy-800aa0321?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
  },
  {
    id: 15,
    name: "Kashinath A",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151006/WhatsApp_Image_2026-01-11_at_22.18.35_cjecrz.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/kashi-nath-232a95325" }
  },
  {
    id: 16,
    name: "Deepu Suresh",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151008/WhatsApp_Image_2026-01-11_at_22.19.55_upou47.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/deepu-suresh-654b99325?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }
  },
  {
    id: 17,
    name: "Anaswar V S",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151007/WhatsApp_Image_2026-01-11_at_22.20.26_cmjaym.jpg",
    socials: {}
  },
  {
    id: 18,
    name: "Edwin Jijo",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151005/WhatsApp_Image_2026-01-11_at_22.18.20_e4pvrz.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/edwin-jijo-b49299323/" }
  },
  {
    id: 19,
    name: "Devadath S",
    role: "Program Officer",
    image: "https://media.licdn.com/dms/image/v2/D5603AQHTK0X6rsRYag/profile-displayphoto-scale_400_400/B56Zis_KrdHQAg-/0/1755248898128?e=1769644800&v=beta&t=BRtg_eAZp1D-N0FvV0KtpDo576Ojdyw8_DGt5FaOp7M",
    socials: { linkedin: "https://www.linkedin.com/in/devadath-s-a5a69529a" }
  }
];

export const EVENTS: Event[] = [
  {
    id: 1,
    title: "Hack The Mind",
    date: "22 Jun 2025",
    description: "An online quiz competition focused on innovation, technology, and entrepreneurship, testing ideas, trends, and problem-solving skills. It challenges participants to think critically and stay updated with emerging concepts.",
    image: "https://res.cloudinary.com/dj4rl6x5j/image/upload/v1768151049/HACK_THE_MIND_o7bdv9.jpg",
    registrationLink: "#",
    type: "Quiz Competition"
  },
  {
    id: 2,
    title: "Beyond The Frame",
    date: "29 Jun 2025",
    description: "An AI-generated concept art competition where participants create original visuals using AI tools, pushing the boundaries of creativity by blending technology and art to transform ideas into striking visuals.",
    image: "https://res.cloudinary.com/dj4rl6x5j/image/upload/v1768151049/BEYOND_FRAME_un8q8j.jpg",
    registrationLink: "#",
    type: "AI Concept Art Contest"
  },
  {
    id: 3,
    title: "Ideathon",
    date: "19 Aug 2025",
    description: "An idea pitching competition where participants present innovative solutions and startup ideas to a judging panel. It focuses on creativity, problem-solving, and potential real-world impact.",
    image: "https://res.cloudinary.com/dj4rl6x5j/image/upload/v1768151049/IDEATHON_f5krs2.jpg",
    registrationLink: "#",
    type: "Idea Pitching Competition"
  },
  {
    id: 4,
    title: "AI Video Generation",
    date: "24 Dec 2025",
    description: "An AI-based video creation competition where participants generate creative videos using AI tools based on a given theme. It encourages storytelling and innovation by turning prompts into engaging visual content.",
    image: "https://res.cloudinary.com/dj4rl6x5j/image/upload/v1768151049/AI_VIDEO_GEN_COMP_ykjjds.jpg",
    registrationLink: "#",
    type: "AI Video Contest"
  }
];

// Added PROJECTS array to fix import error in Projects.tsx
export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "M-Box",
    category: "Hardware",
    status: "Completed",
    description: "An automated medicine dispenser designed for elderly patients, featuring IoT integration and mobile alerts.",
    image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
    team: ["Amil Mether", "Sebin Binoy", "Agnivesh S"]
  },
  {
    id: 2,
    title: "EcoDrive",
    category: "Startup",
    status: "Ongoing",
    description: "A student-led startup focusing on affordable electric vehicle conversion kits for local transport.",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=800&auto=format&fit=crop",
    team: ["Jayalakshmi M", "Alen Jose", "Navya S Nair"]
  },
  {
    id: 3,
    title: "Campus Connect",
    category: "Software",
    status: "Ongoing",
    description: "A centralized platform for student collaboration, event management, and resource sharing within the college ecosystem.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
    team: ["Deepak Suresh", "S Sreenandan", "Nandana Ashok"]
  }
];