export interface NavItem {
  label: string;
  path: string;
}

export interface ExecomMember {
  id: number;
  name: string;
  role: string;
  image: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
  };
}

export interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  image: string;
  registrationLink?: string;
  type: string; 
}

export interface GalleryItem {
  id: number | string;
  title: string;
  category: string;
  image: string;
  link?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  status: 'Completed' | 'Ongoing' | 'Upcoming';
  team: string[];
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  year: string;
  image?: string;
}

export interface PastLeader {
  year: string;
  nodalOfficer: string;
  nodalOfficerImage: string;
  ceo: string;
  ceoImage: string;
}