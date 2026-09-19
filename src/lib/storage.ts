import { CommunityEvent, StudentTicket } from '../types';

export const INITIAL_EVENTS: CommunityEvent[] = [
  { id: 'evt-automate-india-2026', title: 'Automate India NIET Chapter 2026', tagline: 'GenAI & Blockchain Hackathon • Supported by Microsoft Azure', date: 'Saturday, 22nd August 2026', time: '09:00 AM - 06:00 PM IST', venue: 'NIET, Greater Noida Campus', category: 'Hackathon', description: 'Flagship GenAI & Blockchain hackathon supported by Microsoft Azure.', totalSeats: 350, availableSeats: 114, isActive: true, bannerGradient: 'from-blue-600/30 via-cyan-500/20 to-sky-600/10', tags: ['Microsoft Azure', 'GenAI', 'Blockchain', 'Hackathon'], speakers: ['Azure Cloud Architects', 'CodersEra Core Leads'] },
  { id: 'evt-hackera-2026', title: 'HackEra 2026: 36-Hr Global Hackathon', tagline: 'Code. Ship. Scale. | ₹2,00,000+ Prize Bounty & Investor Track', date: 'October 10-11, 2026', time: '10:00 AM Onwards (Continuous 36-Hr)', venue: 'CodersEra Innovation Lab & Tech Center', category: 'Hackathon', description: 'Premier flagship open-source hackathon of CodersEra.', totalSeats: 300, availableSeats: 82, isActive: true, bannerGradient: 'from-cyan-500/20 via-blue-600/20 to-indigo-600/10', tags: ['Full Stack', 'Web3', 'AI/ML', 'Mobile'], speakers: ['Tech Founders', 'Venture Mentors'] },
  { id: 'evt-devforge-bootcamp', title: 'DevForge: Cloud-Native & DevOps Masterclass', tagline: 'Master Containers, Kubernetes, CI/CD Pipelines & Site Reliability', date: 'November 05, 2026', time: '01:00 PM - 06:00 PM IST', venue: 'Advanced Tech Seminar Hall & Virtual Live Stream', category: 'Bootcamp', description: 'Intensive engineering masterclass on containerization and production observability.', totalSeats: 150, availableSeats: 44, isActive: true, bannerGradient: 'from-sky-500/20 via-cyan-600/20 to-blue-700/10', tags: ['Docker', 'Kubernetes', 'CI/CD', 'Observability'], speakers: ['DevOps Lead @ CloudCorp'] },
];
const request = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Request failed.');
  return response.status === 204 ? null : response.json();
};
const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

export async function getStoredEvents(): Promise<CommunityEvent[]> { const events = await request('/api/events') as CommunityEvent[]; return events.length ? events : INITIAL_EVENTS; }
export async function saveEvents(events: CommunityEvent[]) { await Promise.all(events.map(event => request('/api/admin/events', json({ event })))); }
export async function getStoredTickets() { return request('/api/admin/tickets') as Promise<StudentTicket[]>; }
export async function saveTickets(tickets: StudentTicket[]) {
  if (tickets.length === 1) return request('/api/registration', json({ ticket: tickets[0] }));
  await Promise.all(tickets.map(ticket => request('/api/admin/tickets', { method: 'PATCH', body: JSON.stringify({ id: ticket.id, updates: ticket }) })));
}
export function generateUniqueTicketId() { return `CE-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`; }
export async function findExistingTicket(email: string, rollNumber: string, eventId: string) {
  const tickets = await request(`/api/tickets/lookup?q=${encodeURIComponent(email.trim().toLowerCase())}`) as StudentTicket[];
  const rollMatches = await request(`/api/tickets/lookup?q=${encodeURIComponent(rollNumber.trim().toUpperCase())}`) as StudentTicket[];
  return [...tickets, ...rollMatches].find(t => t.eventId === eventId) || null;
}
export async function findTicketsByEmail(email: string) { return request(`/api/tickets/lookup?q=${encodeURIComponent(email.trim().toLowerCase())}`); }
export async function addCommunityEvent(eventData: Omit<CommunityEvent, 'id'> & { id?: string }) {
  const event = { ...eventData, id: eventData.id || `evt-${crypto.randomUUID().slice(0, 12)}`, totalSeats: Number(eventData.totalSeats) || 100, availableSeats: Number(eventData.availableSeats) || Number(eventData.totalSeats) || 100, isActive: eventData.isActive ?? true };
  return request('/api/admin/events', json({ event }));
}
export async function updateCommunityEvent(id: string, updates: Partial<CommunityEvent>) { await request('/api/admin/events', { method: 'PATCH', body: JSON.stringify({ id, updates }) }); return true; }
export async function deleteCommunityEvent(id: string) { await request(`/api/admin/events?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); return true; }
export async function toggleEventStatus(id: string) { const events = await getStoredEvents(); const event = events.find(e => e.id === id); if (!event) return false; await updateCommunityEvent(id, { isActive: !event.isActive }); return !event.isActive; }
export async function toggleTicketCheckIn(ticketId: string, qrPayload?: string) { return request('/api/admin/check-in', json({ ticketId, qrPayload })); }
export async function cleanupAttendeeImages(eventId?: string) { return (await request('/api/admin/cleanup-images', json({ eventId }))).count; }
export async function updateStudentTicket(id: string, updates: Partial<StudentTicket>) { await request('/api/admin/tickets', { method: 'PATCH', body: JSON.stringify({ id, updates }) }); return true; }
export const updateAttendeeTicket = updateStudentTicket;
export async function deleteStudentTicket(id: string) { await request(`/api/admin/tickets?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); return true; }
export const deleteAttendeeTicket = deleteStudentTicket;
