import { StudentTicket } from '../types';

export function exportTicketsToCsv(tickets: StudentTicket[], filename = 'CodersEra_Attendees.csv') {
  if (!tickets || tickets.length === 0) {
    alert('No tickets available to export.');
    return;
  }

  const headers = [
    'Ticket ID',
    'Full Name',
    'Email',
    'Student ID / Roll Number',
    'College / Organization',
    'Branch / Department',
    'Academic Year',
    'Phone Number',
    'Event Name',
    'Registration Date',
    'Email Verified',
    'Attendance Status',
    'Check-in Time',
    'Photo Attached',
    'GitHub Profile',
    'LinkedIn Profile'
  ];

  const rows = tickets.map(t => [
    `"${t.id}"`,
    `"${(t.fullName || '').replace(/"/g, '""')}"`,
    `"${(t.email || '').replace(/"/g, '""')}"`,
    `"${(t.rollNumber || '').replace(/"/g, '""')}"`,
    `"${(t.collegeName || '').replace(/"/g, '""')}"`,
    `"${(t.branch || '').replace(/"/g, '""')}"`,
    `"${(t.year || '').replace(/"/g, '""')}"`,
    `"${(t.phoneNumber || '').replace(/"/g, '""')}"`,
    `"${(t.eventTitle || '').replace(/"/g, '""')}"`,
    `"${new Date(t.createdAt).toLocaleString()}"`,
    t.isVerified ? 'Yes' : 'No',
    t.checkedIn ? 'CHECKED IN' : 'PENDING',
    t.checkedInAt ? `"${new Date(t.checkedInAt).toLocaleString()}"` : 'N/A',
    t.photoBase64 && !t.isPhotoCleanedUp ? 'Yes' : (t.isPhotoCleanedUp ? 'Cleaned Up' : 'No'),
    `"${(t.githubUrl || '').replace(/"/g, '""')}"`,
    `"${(t.linkedinUrl || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
