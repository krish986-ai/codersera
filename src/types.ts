export type Branch = 
  | 'Full Stack & Web Development'
  | 'Artificial Intelligence & Machine Learning'
  | 'Blockchain & Web3 Engineering'
  | 'Cloud Computing & DevOps'
  | 'Cybersecurity & Systems'
  | 'Computer Science & Engineering (CSE)'
  | 'Information Technology (IT)'
  | 'UI/UX & Product Design'
  | 'Other Engineering / Tech';

export type AcademicYear = 
  | '1st / 2nd Year Student'
  | '3rd / 4th Year Student'
  | 'Master\'s / Postgraduate'
  | 'Self-Taught / Professional';

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
  isActive: boolean;
  bannerGradient?: string;
  speakers?: string[];
  tags?: string[];
}

export interface StudentTicket {
  id: string; // Unique Ticket Number, e.g., CE-2026-7841-X7
  eventId: string;
  eventTitle: string;
  fullName: string;
  email: string;
  rollNumber: string; // Student ID / College Roll Number
  collegeName?: string;
  branch: Branch;
  year: AcademicYear;
  phoneNumber: string;
  githubUrl?: string;
  linkedinUrl?: string;
  photoBase64?: string; // photo under 1MB, can be cleaned up later by admin
  isPhotoCleanedUp?: boolean;
  isVerified: boolean;
  verificationCode?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  qrPayload: string;
  gdprConsent: boolean;
}

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
