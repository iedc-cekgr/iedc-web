import { ExecomMember, Event, GalleryItem, Project, TimelineEvent, Achievement, PastLeader } from './types';

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
  { label: 'Execom', path: '/execom' },
  { label: 'Events', path: '/events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Legacy', path: '/legacy' },
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
    socials: { linkedin: "https://www.linkedin.com/in/sebin-binoy" }
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
    socials: { linkedin: "https://www.linkedin.com/in/madhav-m-anish-9a5a5731b" }
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
    socials: { linkedin: "https://www.linkedin.com/in/s-sreenandan-6b480b28b" }
  },
  {
    id: 12,
    name: "Deepak Suresh",
    role: "Research Lead",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151008/WhatsApp_Image_2026-01-11_at_22.20.51_gyqacp.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/deepak-suresh-11545218b" }
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
    socials: { linkedin: "https://www.linkedin.com/in/jeswin-joy-800aa0321" }
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
    socials: { linkedin: "https://www.linkedin.com/in/deepu-suresh-654b99325" }
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
    description: "An online quiz competition focused on innovation, technology, and entrepreneurship.",
    image: "https://res.cloudinary.com/dj4rl6x5j/image/upload/v1768151049/HACK_THE_MIND_o7bdv9.jpg",
    type: "Quiz Competition"
  },
  {
    id: 2,
    title: "Beyond The Frame",
    date: "29 Jun 2025",
    description: "An AI-generated concept art competition pushing the boundaries of creativity.",
    image: "https://res.cloudinary.com/dj4rl6x5j/image/upload/v1768151049/BEYOND_FRAME_un8q8j.jpg",
    type: "AI Concept Art Contest"
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Python Workshop",
    category: "Workshop",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-01-12_at_10.30.14_aenm4p.jpg"
  },
  {
    id: 2,
    title: "3D Printer Workshop",
    category: "Workshop",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-01-12_at_10.30.13_lylvyb.jpg"
  },
  {
    id: 3,
    title: "Fablab Visit",
    category: "Industrial Visit",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-01-12_6at_10.30.13_itrfiu.jpg"
  },
  {
    id: 4,
    title: "IEDC Summit",
    category: "Community Meetup",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-01-12_at_10.30.12_ty212a.jpg"
  },
  {
    id: 5,
    title: "Spinningmil Visit",
    category: "Industrial Visit",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768194837/WhatsApp_Image_2026-012_at_10.30.14_c1pfpv.jpg"
  },
  {
    id: 6,
    title: "Talk Session",
    category: "Talk Session",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_15_z055yf.jpg"
  },
  {
    id: 7,
    title: "Start up pitching Competition",
    category: "Competition",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_12_kkdkz9.jpg"
  },
  {
    id: 8,
    title: "IT QUIZ",
    category: "Competition",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_13_d9nsan.jpg"
  },
  {
    id: 9,
    title: "Google It",
    category: "Competition",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_11_plb51h.jpg"
  },
  {
    id: 10,
    title: "Arduino workshop",
    category: "Workshop",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197872/fetch_7_nvwqs9.jpg"
  },
  {
    id: 11,
    title: "Arduino workshop (Hands-on)",
    category: "Workshop",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197872/fetch_8_onaczg.jpg"
  },
  {
    id: 12,
    title: "TOPSY TURVY",
    category: "Competition",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_10_hnprbw.jpg"
  },
  {
    id: 13,
    title: "PHOTOGRPHY Competiton",
    category: "Competition",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768197871/fetch_14_yeigmk.jpg"
  }
];

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Smart Campus App",
    description: "An all-in-one mobile application for students.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200",
    category: "Software",
    status: "Completed",
    team: ["Amil", "Jeswin"]
  }
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { year: "2015", title: "Inception", description: "IEDC was formally established at CE Kidangoor." },
  { year: "2023", title: "Regional Hub", description: "Recognized as a leading innovation hub." }
];

export const ACHIEVEMENTS: Achievement[] = [
  { 
    id: 1, 
    title: "KSUM Best Performer", 
    year: "2022", 
    description: "Ranked among the top IEDCs in Kerala.", 
    icon: "Trophy",
    image: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?q=80&w=800"
  }
];

export const PAST_LEADERS: PastLeader[] = [
  { 
    year: "2023-24", 
    nodalOfficer: "Chinchu M", 
    nodalOfficerImage: "https://res.cloudinary.com/dli8bbort/image/upload/v1768152331/WhatsApp_Image_2026-01-11_at_22.55.07_jqfpym.jpg",
    ceo: "Jayalakshmi M",
    ceoImage: "https://res.cloudinary.com/dli8bbort/image/upload/v1768150968/WhatsApp_Image_2026-01-11_at_22.18.07_jb2ngr.jpg"
  }
];