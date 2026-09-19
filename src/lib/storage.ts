import { CommunityEvent, StudentTicket } from '../types';

const STORAGE_KEYS = {
  EVENTS: 'codersera_events_db_v2',
  TICKETS: 'codersera_tickets_db_v2',
  FIREBASE_CONFIG: 'codersera_firebase_custom_config',
  ADMIN_SESSION: 'codersera_admin_logged_in',
};

export const INITIAL_EVENTS: CommunityEvent[] = [
  {
    id: 'evt-automate-india-2026',
    title: 'Automate India NIET Chapter 2026',
    tagline: 'GenAI & Blockchain Hackathon • Supported by Microsoft Azure',
    date: 'Saturday, 22nd August 2026',
    time: '09:00 AM - 06:00 PM IST',
    venue: 'NIET, Greater Noida Campus',
    category: 'Hackathon',
    description: 'Flagship GenAI & Blockchain hackathon supported by Microsoft Azure. Team size 2-3 members with project tracks in autonomous AI agents, web3 infra, enterprise automation, and smart contracts.',
    totalSeats: 350,
    availableSeats: 114,
    isActive: true,
    bannerGradient: 'from-blue-600/30 via-cyan-500/20 to-sky-600/10',
    tags: ['Microsoft Azure', 'GenAI', 'Blockchain', 'Hackathon'],
    speakers: ['Azure Cloud Architects', 'CodersEra Core Leads'],
  },
  {
    id: 'evt-hackera-2026',
    title: 'HackEra 2026: 36-Hr Global Hackathon',
    tagline: 'Code. Ship. Scale. | ₹2,00,000+ Prize Bounty & Investor Track',
    date: 'October 10-11, 2026',
    time: '10:00 AM Onwards (Continuous 36-Hr)',
    venue: 'CodersEra Innovation Lab & Tech Center',
    category: 'Hackathon',
    description: 'Premier flagship open-source hackathon of CodersEra. 36 hours of rapid building, real-time mentorship from industry tech leads, food, computing pods, and recruiter access.',
    totalSeats: 300,
    availableSeats: 82,
    isActive: true,
    bannerGradient: 'from-cyan-500/20 via-blue-600/20 to-indigo-600/10',
    tags: ['Full Stack', 'Web3', 'AI/ML', 'Mobile'],
    speakers: ['Tech Founders', 'Venture Mentors'],
  },
  {
    id: 'evt-devforge-bootcamp',
    title: 'DevForge: Cloud-Native & DevOps Masterclass',
    tagline: 'Master Containers, Kubernetes, CI/CD Pipelines & Site Reliability',
    date: 'November 05, 2026',
    time: '01:00 PM - 06:00 PM IST',
    venue: 'Advanced Tech Seminar Hall & Virtual Live Stream',
    category: 'Bootcamp',
    description: 'Intensive engineering masterclass on containerization, zero-downtime rolling deployments, Kubernetes cluster orchestration, and production observability.',
    totalSeats: 150,
    availableSeats: 44,
    isActive: true,
    bannerGradient: 'from-sky-500/20 via-cyan-600/20 to-blue-700/10',
    tags: ['Docker', 'Kubernetes', 'CI/CD', 'Observability'],
    speakers: ['DevOps Lead @ CloudCorp'],
  }
];

export const INITIAL_TICKETS: StudentTicket[] = [
  {
    id: 'CE-2026-9142-X7',
    eventId: 'evt-automate-india-2026',
    eventTitle: 'Automate India NIET Chapter 2026',
    fullName: 'Aditya Raj Srivastava',
    email: 'aditya.dev@codersera.in',
    rollNumber: 'DEV-2026-015',
    collegeName: 'NIET Greater Noida',
    branch: 'Computer Science & Engineering',
    year: 'Senior Student (3rd / 4th Year)',
    phoneNumber: '+91 9876543210',
    githubUrl: 'https://github.com/adityarajs',
    linkedinUrl: 'https://linkedin.com/in/adityarajsrivastava',
    isVerified: true,
    checkedIn: true,
    checkedInAt: '2026-08-22T04:15:00.000Z',
    createdAt: '2026-08-01T10:00:00.000Z',
    qrPayload: 'CE-2026-9142-X7|aditya.dev@codersera.in|DEV-2026-015|evt-automate-india-2026',
    gdprConsent: true,
  },
  {
    id: 'CE-2026-3829-K2',
    eventId: 'evt-automate-india-2026',
    eventTitle: 'Automate India NIET Chapter 2026',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@codersera.in',
    rollNumber: 'DEV-2026-048',
    collegeName: 'School of Computing Sciences',
    branch: 'Artificial Intelligence & Machine Learning',
    year: 'Senior Student (3rd / 4th Year)',
    phoneNumber: '+91 9811223344',
    githubUrl: 'https://github.com/priyasharma-dev',
    linkedinUrl: 'https://linkedin.com/in/priyasharma',
    isVerified: true,
    checkedIn: false,
    createdAt: '2026-08-05T14:22:00.000Z',
    qrPayload: 'CE-2026-3829-K2|priya.sharma@codersera.in|DEV-2026-048|evt-automate-india-2026',
    gdprConsent: true,
  },
  {
    id: 'CE-2026-5714-M9',
    eventId: 'evt-hackera-2026',
    eventTitle: 'HackEra 2026: 36-Hr Global Hackathon',
    fullName: 'Rohan Verma',
    email: 'rohan.verma@codersera.in',
    rollNumber: 'DEV-2026-102',
    collegeName: 'Faculty of Engineering',
    branch: 'Full Stack & Web Development',
    year: 'Student Developer (1st / 2nd Year)',
    phoneNumber: '+91 9722334455',
    isVerified: true,
    checkedIn: false,
    createdAt: '2026-08-10T09:12:00.000Z',
    qrPayload: 'CE-2026-5714-M9|rohan.verma@codersera.in|DEV-2026-102|evt-hackera-2026',
    gdprConsent: true,
  }
];

export function getStoredEvents(): CommunityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return parsed;
  } catch {
    return INITIAL_EVENTS;
  }
}

export function saveEvents(events: CommunityEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events:', e);
  }
}

export function getStoredTickets(): StudentTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return parsed;
  } catch {
    return INITIAL_TICKETS;
  }
}

export function saveTickets(tickets: StudentTicket[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to save tickets:', e);
  }
}

// Generate unique Ticket ID: CE-YEAR-RANDOM-SUFFIX
export function generateUniqueTicketId(): string {
  const year = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = chars.charAt(Math.floor(Math.random() * chars.length)) + 
                 chars.charAt(Math.floor(Math.random() * chars.length));
  return `CE-${year}-${randNum}-${suffix}`;
}

// Check if user already has a ticket for this event
export function findExistingTicket(email: string, rollNumber: string, eventId: string): StudentTicket | null {
  const tickets = getStoredTickets();
  const cleanEmail = email.trim().toLowerCase();
  const cleanRoll = rollNumber.trim().toUpperCase();

  const found = tickets.find(t => 
    t.eventId === eventId && (
      t.email.trim().toLowerCase() === cleanEmail || 
      t.rollNumber.trim().toUpperCase() === cleanRoll
    )
  );

  return found || null;
}

// Check if user has ANY ticket in the system
export function findTicketsByEmail(email: string): StudentTicket[] {
  const tickets = getStoredTickets();
  const cleanEmail = email.trim().toLowerCase();
  return tickets.filter(t => t.email.trim().toLowerCase() === cleanEmail);
}

// EVENT MANAGEMENT (Admin Controls)
export function addCommunityEvent(eventData: Omit<CommunityEvent, 'id'> & { id?: string }): CommunityEvent {
  const events = getStoredEvents();
  const id = eventData.id || `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newEvent: CommunityEvent = {
    ...eventData,
    id,
    totalSeats: Number(eventData.totalSeats) || 100,
    availableSeats: Number(eventData.availableSeats) || Number(eventData.totalSeats) || 100,
    isActive: eventData.isActive !== undefined ? eventData.isActive : true,
    bannerGradient: eventData.bannerGradient || 'from-cyan-500/20 via-blue-600/20 to-indigo-600/10',
  };

  events.unshift(newEvent);
  saveEvents(events);
  return newEvent;
}

export function updateCommunityEvent(eventId: string, updates: Partial<CommunityEvent>): boolean {
  const events = getStoredEvents();
  const idx = events.findIndex(e => e.id === eventId);
  if (idx === -1) return false;

  events[idx] = {
    ...events[idx],
    ...updates,
  };
  saveEvents(events);
  return true;
}

export function deleteCommunityEvent(eventId: string): boolean {
  const events = getStoredEvents();
  const filtered = events.filter(e => e.id !== eventId);
  if (filtered.length === events.length) return false;

  saveEvents(filtered);
  return true;
}

export function toggleEventStatus(eventId: string): boolean {
  const events = getStoredEvents();
  const idx = events.findIndex(e => e.id === eventId);
  if (idx === -1) return false;

  events[idx].isActive = !events[idx].isActive;
  saveEvents(events);
  return events[idx].isActive;
}

// Toggle Check-in status
export function toggleTicketCheckIn(ticketId: string): { success: boolean; ticket?: StudentTicket } {
  const tickets = getStoredTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return { success: false };

  const updatedTicket = {
    ...tickets[idx],
    checkedIn: !tickets[idx].checkedIn,
    checkedInAt: !tickets[idx].checkedIn ? new Date().toISOString() : undefined,
  };

  tickets[idx] = updatedTicket;
  saveTickets(tickets);
  return { success: true, ticket: updatedTicket };
}

// Image Cleanup feature: purges photos of completed events or all tickets to save storage
export function cleanupAttendeeImages(eventId?: string): number {
  const tickets = getStoredTickets();
  let count = 0;

  const updated = tickets.map(t => {
    if (!eventId || t.eventId === eventId) {
      if (t.photoBase64) {
        count++;
        return {
          ...t,
          photoBase64: undefined,
          isPhotoCleanedUp: true,
        };
      }
    }
    return t;
  });

  saveTickets(updated);
  return count;
}

// Database Operations: update attendee pass record
export function updateStudentTicket(ticketId: string, updates: Partial<StudentTicket>): boolean {
  const tickets = getStoredTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return false;

  tickets[idx] = {
    ...tickets[idx],
    ...updates,
  };
  saveTickets(tickets);
  return true;
}

export const updateAttendeeTicket = updateStudentTicket;

// Database Operations: delete attendee pass record
export function deleteStudentTicket(ticketId: string): boolean {
  const tickets = getStoredTickets();
  const filtered = tickets.filter(t => t.id !== ticketId);
  if (filtered.length === tickets.length) return false;

  saveTickets(filtered);
  return true;
}

export const deleteAttendeeTicket = deleteStudentTicket;
