export interface NavItem {
  label: string;
  path: string;
}

export interface ExecomMember {
  id: number;
  order?: number;
  name: string;
  role: string;
  profileRole?: string;
  image: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    email?: string;
    portfolio?: string;
  };
}

export interface Event {
  id: number;
  title: string;
  date: string; // Used for legacy display, usually startDateTime is preferred now
  description: string;
  image: string;
  
  // Existing legacy fields (optional)
  registrationLink?: string;
  registrationButtonText?: string;
  
  // New Registration fields
  eventType?: 'google-form' | 'website-form';
  googleFormLink?: string;
  registrationStartDateTime?: string;
  registrationEndDateTime?: string;
  isRegistrationEnabled?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  paymentQrUrl?: string;
  feeAmount?: number;
  customFields?: CustomField[];
  enableReferralCode?: boolean;
  whatsappLink?: string;
  slug?: string;
  guidelines?: string;
  prizePool?: string;
  speakerName?: string;
  isVisible?: boolean;
  
  type: string; 
  mode?: 'Online' | 'Offline';
  startDateTime?: string;
  endDateTime?: string;
}

export interface CustomField {
  id: string;
  type: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio' | 'file';
  label: string;
  required: boolean;
  options?: string[]; // For dropdown, checkbox, radio
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image: string;
  driveLink?: string;
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
  additionalPioneers?: {
    name: string;
    role: string;
    image: string;
  }[];
}

export interface Promoter {
  id?: string;
  name: string;
  code: string;
  siteReferrals: number;
  gformReferrals: number;
  totalReferrals: number;
  isActive: boolean;
  createdAt?: any;
}

export interface IdeaSubmission {
  id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  semester: string;
  title: string;
  category: string;
  problemStatement: string;
  solutionDescription: string;
  targetAudience: string;
  teamSize: string;
  teamMembers?: string;
  supportNeeded: string[];
  pitchDeckUrl?: string;
  timestamp: any;
}