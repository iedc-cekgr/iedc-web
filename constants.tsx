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
    name: "S Sreenandan",
    role: "CEO",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777729852/S_Sreenandan_c6ft7s.jpg",
    socials: { linkedin: "http://www.linkedin.com/in/s-sreenandan-6b480b28b" }
  },
  {
    id: 3,
    name: "Anaswar V S",
    role: "COO",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730159/Anaswar_vs_emsemk.jpg",
    socials: { linkedin: "" }
  },
  {
    id: 4,
    name: "Sachu Sajeev",
    role: "CTO",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730161/Sachu_sajeev_rukz9i.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/sachu-sajeev-aaa5892b4/" }
  },
  {
    id: 5,
    name: "Alsafan Anas",
    role: "CCO",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730103/20260320_091117_-_Alsafan_Anas_rgeakd.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/agnivesh-s-542086318" }
  },
  {
    id: 6,
    name: "Muhammed Thahir",
    role: "CMO",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730177/Muhammed_Thahir_kpe54d.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/alen-jose-438767370" }
  },
  {
    id: 8,
    name: "Adwaith Somkumar",
    role: "CFO",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730160/Adwaith_Somkumar_rgkvyb.png",
    socials: { linkedin: "https://www.linkedin.com/in/navya-s-nair-45079a321" }
  },
  {
    id: 9,
    name: "Ansara Beegam",
    role: "WIE",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730187/Ansara_Beegam_neg2sl.png",
    socials: { linkedin: "https://www.linkedin.com/in/ansara-beegam-913399383?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
  },
  {
    id: 14,
    name: "Jeswin Joy",
    role: "QUALITY & OPERATION LEAD",
    image: "https://res.cloudinary.com/dli8bbort/image/upload/v1768151006/WhatsApp_Image_2026-01-11_at_22.18.25_o13nmx.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/jeswin-joy-800aa0321" }
  },
  {
    id: 13,
    name: "Edwin Jijo",
    role: "Community Head",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730170/Edwin_Jijo_bwu6fo.webp",
    socials: { linkedin: "https://www.linkedin.com/in/edwin-jijo-b49299323/"}
  },
  {
    id: 12,
    name: "Adwaith Krishna S",
    role: "Research Lead",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777730096/Adwaith_Krishna_z4yfah.png",
    socials: { linkedin: "https://www.linkedin.com/in/adwaith-krishna-s?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
  },
  {
    id: 7,
    name: "Nihal Ajinas",
    role: "DESIGNER LEAD I",
    image: "https://res.cloudinary.com/dvntu7mui/image/upload/v1778914945/WhatsApp_Image_2026-05-16_at_12.31.52_PM_dxswaa.jpg",
    socials: { linkedin: "" }
  },
  {
    id: 10,
    name: "Adwaith Manoj",
    role: "DESIGNER LEAD II",
    image: "https://res.cloudinary.com/dvntu7mui/image/upload/v1778914555/WhatsApp_Image_2026-05-16_at_12.20.35_PM_i111hx.jpg",
    socials: { linkedin: "" }
  },
  {
    id: 11,
    name: "Madhav M",
    role: "CREATIVE LEAD II",
    image: "https://res.cloudinary.com/dvntu7mui/image/upload/v1778914504/WhatsApp_Image_2026-05-16_at_12.20.34_PM_dcxl39.jpg",
    socials: { linkedin: "" }
  },
  {
    id: 15,
    name: "Nowrin Fathima",
    role: "COMMUNITY LEAD",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778865939/Nowrin_Fathima_vgf6f3.jpg",
    socials: { linkedin: "" }
  },
  {
    id: 16,
    name: "Vivek S",
    role: "COMMUNITY LEAD",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778335573/ee2aed0556a035cb46f893d761edd6c976ae4e99a30ebec279cfc1c2f0dc62b4_-_Vivek_S_rzdkd0.png",
    socials: { linkedin: "https://www.linkedin.com/in/vivek-s-026692384?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
  },
  {
    id: 17,
    name: "Anna Meeval Sunny",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778335561/Anna_Meeval_tsue3b.jpg",
    socials: { linkedin:"https://www.linkedin.com/in/anna-meeval-56a0a7384?utm_source=share_via&utm_content=profile&utm_medium=member_android"}
  },
  {
    id: 18,
    name: "Aiswarya Haridas",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778335596/Aiswarya_Haridas_edvb18.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/aiswarya-haridas-a62537387?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
  },
  {
    id: 19,
    name: "Devendu Hari",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778335602/Devendu_Hari_lacm7s.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/devendu-hari-972642387?utm_source=share_via&utm_content=profile&utm_medium=member_ios" }
  },
  {
    id: 19,
    name: "Ganga V",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778335562/Ganga_Vinod_f6wxru.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/ganga-v-162703383?utm_source=share_via&utm_content=profile&utm_medium=member_android",github:"https://github.com/vinodganga178-dot" }
  },
  {
    id: 19,
    name: "Drishya A B",
    role: "Program Officer",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778335568/drishya_-_Drishya_y8fgs0.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/drishya-a-b-44a789383?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
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
    id: 14,
    title: "IEDC AGM'26",
    category: "Event",
    image: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1778948026/WhatsApp_Image_2026-05-15_at_10.23.50_PM_yn7l71.jpg",
    driveLink: "https://drive.google.com/drive/folders/1Kpxg8kkc325WZNmHfbuDDhHvpQiGuPCt?usp=drive_link"
  },
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
    ceo: "S Sreenandan",
    ceoImage: "https://res.cloudinary.com/dzv86vcdt/image/upload/v1777729852/S_Sreenandan_c6ft7s.jpg"
  }
];
