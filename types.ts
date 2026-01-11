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

// Added Project interface
export interface Project {
  id: number;
  title: string;
  category: string;
  status: string;
  description: string;
  image: string;
  team: string[];
}