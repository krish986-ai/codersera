export type Branch = 
  | 'Full Stack & Web Development'
  | 'Artificial Intelligence & Machine Learning'
  | 'Cloud Computing & DevOps'
  | 'Cybersecurity & Systems'
  | 'Blockchain & Web3 Engineering'
  | 'Mobile & App Engineering'
  | 'UI/UX & Product Design'
  | 'Computer Science & Engineering'
  | 'Open Source & General Engineering';

export type AcademicYear = 
  | 'Student Developer (1st / 2nd Year)'
  | 'Senior Student (3rd / 4th Year)'
  | 'Postgraduate / Researcher'
  | 'Working Professional / Builder';

export type DeveloperTrack = Branch;
export type ExperienceStage = AcademicYear;

export interface CommunityEvent {
  id: string;
  title: string;
  tagline: string;
  date: string;
  time: string;
  venue: string;
  category: 'Hackathon' | 'Workshop' | 'DevCon' | 'Bootcamp' | 'Meetup' | 'Tech Summit' | 'Code Sprint';
  description: string;
  totalSeats: number;
  availableSeats: number;
  generatedPasses?: number;
  isActive: boolean;
  isFeatured?: boolean;
  featuredImageUrl?: string;
  bannerGradient?: string;
  speakers?: string[];
  tags?: string[];
}

export interface StudentTicket {
  id: string; // Unique Ticket / Pass ID, e.g., CE-2026-7841-X7
  eventId: string;
  eventTitle: string;
  fullName: string;
  email: string;
  rollNumber: string; // Attendee ID / Student Roll Number
  collegeName?: string; // Institution / Organization / University
  branch: Branch; // Developer Track / Domain
  year: AcademicYear; // Stage / Experience Level
  phoneNumber: string;
  githubUrl?: string;
  linkedinUrl?: string;
  photoBase64?: string; // photo under 1MB
  isPhotoCleanedUp?: boolean;
  isVerified: boolean;
  verificationCode?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  qrPayload: string;
  gdprConsent: boolean;
}

export type AttendeeTicket = StudentTicket;

export interface RegistrationFormData {
  eventId: string;
  fullName: string;
  email: string;
  rollNumber: string;
  collegeName?: string;
  branch: Branch;
  year: AcademicYear;
  phoneNumber: string;
  githubUrl: string;
  linkedinUrl: string;
  photoFile: File | null;
  photoBase64: string;
  gdprConsent: boolean;
}

export interface FilterOptions {
  eventId: string;
  searchQuery: string;
  branch: string;
  year: string;
  checkedInStatus: 'all' | 'checkedIn' | 'pending';
}

export interface AdminStats {
  totalRegistrations: number;
  totalCheckedIn: number;
  totalEvents: number;
  activeEvents: number;
  branchCounts: Record<string, number>;
  yearCounts: Record<string, number>;
}
