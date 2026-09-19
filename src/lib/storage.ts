import {
  collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction,
  setDoc, updateDoc, where,
} from 'firebase/firestore';
import { CommunityEvent, StudentTicket } from '../types';
import { getFirebaseInstance } from './firebaseConfig';

export const INITIAL_EVENTS: CommunityEvent[] = [
  { id: 'evt-automate-india-2026', title: 'Automate India NIET Chapter 2026', tagline: 'GenAI & Blockchain Hackathon • Supported by Microsoft Azure', date: 'Saturday, 22nd August 2026', time: '09:00 AM - 06:00 PM IST', venue: 'NIET, Greater Noida Campus', category: 'Hackathon', description: 'Flagship GenAI & Blockchain hackathon supported by Microsoft Azure.', totalSeats: 350, availableSeats: 114, isActive: true, bannerGradient: 'from-blue-600/30 via-cyan-500/20 to-sky-600/10', tags: ['Microsoft Azure', 'GenAI', 'Blockchain', 'Hackathon'], speakers: ['Azure Cloud Architects', 'CodersEra Core Leads'] },
  { id: 'evt-hackera-2026', title: 'HackEra 2026: 36-Hr Global Hackathon', tagline: 'Code. Ship. Scale. | ₹2,00,000+ Prize Bounty & Investor Track', date: 'October 10-11, 2026', time: '10:00 AM Onwards (Continuous 36-Hr)', venue: 'CodersEra Innovation Lab & Tech Center', category: 'Hackathon', description: 'Premier flagship open-source hackathon of CodersEra.', totalSeats: 300, availableSeats: 82, isActive: true, bannerGradient: 'from-cyan-500/20 via-blue-600/20 to-indigo-600/10', tags: ['Full Stack', 'Web3', 'AI/ML', 'Mobile'], speakers: ['Tech Founders', 'Venture Mentors'] },
  { id: 'evt-devforge-bootcamp', title: 'DevForge: Cloud-Native & DevOps Masterclass', tagline: 'Master Containers, Kubernetes, CI/CD Pipelines & Site Reliability', date: 'November 05, 2026', time: '01:00 PM - 06:00 PM IST', venue: 'Advanced Tech Seminar Hall & Virtual Live Stream', category: 'Bootcamp', description: 'Intensive engineering masterclass on containerization and production observability.', totalSeats: 150, availableSeats: 44, isActive: true, bannerGradient: 'from-sky-500/20 via-cyan-600/20 to-blue-700/10', tags: ['Docker', 'Kubernetes', 'CI/CD', 'Observability'], speakers: ['DevOps Lead @ CloudCorp'] },
];

export const INITIAL_TICKETS: StudentTicket[] = [];

function db() {
  const instance = getFirebaseInstance().db;
  if (!instance) throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables.');
  return instance;
}

export async function getStoredEvents(): Promise<CommunityEvent[]> {
  const snapshot = await getDocs(collection(db(), 'events'));
  if (snapshot.empty) {
    await Promise.all(INITIAL_EVENTS.map(event => setDoc(doc(db(), 'events', event.id), event)));
    return INITIAL_EVENTS;
  }
  return snapshot.docs.map(item => item.data() as CommunityEvent);
}

export async function saveEvents(events: CommunityEvent[]): Promise<void> {
  await Promise.all(events.map(event => setDoc(doc(db(), 'events', event.id), event)));
}

export async function getStoredTickets(): Promise<StudentTicket[]> {
  const snapshot = await getDocs(collection(db(), 'tickets'));
  return snapshot.docs.map(item => item.data() as StudentTicket);
}

export async function saveTickets(tickets: StudentTicket[]): Promise<void> {
  await Promise.all(tickets.map(ticket => setDoc(doc(db(), 'tickets', ticket.id), ticket)));
}

function generateRandomIdPart(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16)).join('').slice(0, length).toUpperCase();
}
export function generateUniqueTicketId(): string {
  return `CE-${new Date().getFullYear()}-${generateRandomIdPart(12)}`;
}

export async function findExistingTicket(email: string, rollNumber: string, eventId: string): Promise<StudentTicket | null> {
  const snapshot = await getDocs(query(collection(db(), 'tickets'), where('eventId', '==', eventId)));
  const cleanEmail = email.trim().toLowerCase();
  const cleanRoll = rollNumber.trim().toUpperCase();
  return (snapshot.docs.map(item => item.data() as StudentTicket).find(ticket =>
    ticket.email.toLowerCase() === cleanEmail || ticket.rollNumber.toUpperCase() === cleanRoll
  )) || null;
}
export async function findTicketsByEmail(email: string): Promise<StudentTicket[]> {
  const snapshot = await getDocs(query(collection(db(), 'tickets'), where('email', '==', email.trim().toLowerCase())));
  return snapshot.docs.map(item => item.data() as StudentTicket);
}

export async function addCommunityEvent(eventData: Omit<CommunityEvent, 'id'> & { id?: string }): Promise<CommunityEvent> {
  const event = { ...eventData, id: eventData.id || `evt-${generateRandomIdPart(12).toLowerCase()}`, totalSeats: Number(eventData.totalSeats) || 100, availableSeats: Number(eventData.availableSeats) || Number(eventData.totalSeats) || 100, isActive: eventData.isActive ?? true, bannerGradient: eventData.bannerGradient || 'from-cyan-500/20 via-blue-600/20 to-indigo-600/10' };
  await setDoc(doc(db(), 'events', event.id), event);
  return event;
}
export async function updateCommunityEvent(eventId: string, updates: Partial<CommunityEvent>): Promise<boolean> {
  const ref = doc(db(), 'events', eventId);
  if (!(await getDoc(ref)).exists()) return false;
  await updateDoc(ref, updates);
  return true;
}
export async function deleteCommunityEvent(eventId: string): Promise<boolean> {
  const ref = doc(db(), 'events', eventId);
  if (!(await getDoc(ref)).exists()) return false;
  await deleteDoc(ref); return true;
}
export async function toggleEventStatus(eventId: string): Promise<boolean> {
  const ref = doc(db(), 'events', eventId); const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const active = !(snap.data() as CommunityEvent).isActive;
  await updateDoc(ref, { isActive: active }); return active;
}
export async function toggleTicketCheckIn(ticketId: string): Promise<{ success: boolean; ticket?: StudentTicket }> {
  const ref = doc(db(), 'tickets', ticketId);
  const ticket = await runTransaction(db(), async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return null;
    const current = snap.data() as StudentTicket;
    const updated = { ...current, checkedIn: !current.checkedIn, checkedInAt: !current.checkedIn ? new Date().toISOString() : undefined };
    transaction.set(ref, updated); return updated;
  });
  return ticket ? { success: true, ticket } : { success: false };
}
export async function cleanupAttendeeImages(eventId?: string): Promise<number> {
  const tickets = await getStoredTickets(); const affected = tickets.filter(t => (!eventId || t.eventId === eventId) && t.photoBase64);
  await Promise.all(affected.map(t => updateDoc(doc(db(), 'tickets', t.id), { photoBase64: null, isPhotoCleanedUp: true })));
  return affected.length;
}
export async function updateStudentTicket(ticketId: string, updates: Partial<StudentTicket>): Promise<boolean> {
  const ref = doc(db(), 'tickets', ticketId); if (!(await getDoc(ref)).exists()) return false;
  await updateDoc(ref, updates); return true;
}
export const updateAttendeeTicket = updateStudentTicket;
export async function deleteStudentTicket(ticketId: string): Promise<boolean> {
  const ref = doc(db(), 'tickets', ticketId); if (!(await getDoc(ref)).exists()) return false;
  await deleteDoc(ref); return true;
}
export const deleteAttendeeTicket = deleteStudentTicket;
