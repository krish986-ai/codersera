import React, { useEffect, useState, useRef } from 'react';
import { 
  Download, Printer, Share2, Check, Copy, Calendar, MapPin, 
  User, ShieldCheck, Sparkles, ExternalLink, ArrowLeft, Building2 
} from 'lucide-react';
import { StudentTicket } from '../types';
import { generateQrDataUrl } from '../lib/qrcode';
import { CodersEraLogo } from './CodersEraLogo';
import confetti from 'canvas-confetti';

interface TicketBadgeProps {
  ticket: StudentTicket;
  onBack?: () => void;
  showBackBtn?: boolean;
}

export const TicketBadge: React.FC<TicketBadgeProps> = ({ ticket, onBack, showBackBtn = true }) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate QR code for this ticket
    generateQrDataUrl(ticket.qrPayload || ticket.id).then(url => {
      setQrSrc(url);
    });

    // Fire celebratory confetti on ticket view
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#0099ff', '#38bdf8', '#6366f1'],
      });
    } catch {
      // ignore
    }
  }, [ticket]);

  // 3D tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / 25),
      y: x / 25,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const downloadQrCode = () => {
    if (!qrSrc) return;
    const a = document.createElement('a');
    a.href = qrSrc;
    a.download = `codersera-pass-qr-${ticket.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyTicketId = () => {
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadCalendarFile = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CodersEra//Ticket System//EN
BEGIN:VEVENT
UID:${ticket.id}@codersera.in
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:20260822T040000Z
DTEND:20260822T113000Z
SUMMARY:${ticket.eventTitle} - CodersEra
DESCRIPTION:CodersEra Event Pass: ${ticket.id}\\nAttendee: ${ticket.fullName}\\nAttendee ID: ${ticket.rollNumber}
LOCATION:CodersEra Event Venue
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ticket.id}_CodersEra_Pass.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center py-6 px-4 max-w-4xl mx-auto">
      {/* Top action controls */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6">
        {showBackBtn && onBack && (
          <button
            id="ticket-back-btn"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Events</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            id="ticket-copy-id-btn"
            onClick={copyTicketId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : ticket.id}</span>
          </button>

          <button
            id="ticket-add-cal-btn"
            onClick={downloadCalendarFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-sky-500/50 hover:text-sky-300 transition-all"
            title="Add to Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Add to Calendar</span>
          </button>

          <button
            id="ticket-download-qr-btn"
            onClick={downloadQrCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all font-mono"
            title="Download Pass QR Code"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Save QR</span>
          </button>

          <button
            id="ticket-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,180,255,0.3)] transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass / PDF</span>
          </button>
        </div>
      </div>

      {/* Confirmation Pill */}
      <div className="flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>Verified Digital Pass • Single Allocation Active</span>
      </div>

      {/* The Printable / Interactive Ticket Badge */}
      <div
        id="printable-ticket"
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
        className="relative w-full max-w-md sm:max-w-xl rounded-3xl overflow-hidden bg-gradient-to-b from-[#080f24] via-[#060b18] to-[#02050c] border border-cyan-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(0,180,255,0.15)] p-6 sm:p-8"
      >
        {/* Subtle Cyber Corner Accents */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

        {/* Lanyard punch hole simulation */}
        <div className="mx-auto w-16 h-3.5 rounded-full bg-[#030610] border border-slate-700/80 mb-6 flex items-center justify-center">
          <div className="w-8 h-1 rounded-full bg-slate-800" />
        </div>

        {/* Top Header inside Ticket */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/90 pb-5 mb-6">
          <div>
            <CodersEraLogo size="md" showText={true} />
            <span className="text-[11px] text-slate-400 font-mono block mt-1">
              Official Community Developer Pass
            </span>
          </div>

          {/* Verification Status Pill */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{ticket.checkedIn ? 'CHECKED IN' : 'VERIFIED PASS'}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              GATE ACCESS: ALLOCATED
            </div>
          </div>
        </div>

        {/* Event Title Banner */}
        <div className="mb-6">
          <span className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase font-semibold">
            Official Access Pass
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            {ticket.eventTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Confirmed Reservation
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Main Tech Center
            </span>
          </div>
        </div>

        {/* Middle Student Information Section with Photo & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-950/70 rounded-2xl border border-slate-800/90 p-5 mb-6">
          {/* Badge Photo */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border-2 border-cyan-500/50 bg-slate-900 shadow-[0_0_20px_rgba(0,180,255,0.2)]">
              {ticket.photoBase64 && !ticket.isPhotoCleanedUp ? (
                <img
                  src={ticket.photoBase64}
                  alt={ticket.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-500">
                  <User className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="text-[9px] font-mono leading-tight">
                    {ticket.isPhotoCleanedUp ? 'Image Purged' : 'Badge Photo'}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm py-0.5 text-center text-[9px] font-mono text-cyan-400 font-bold border-t border-cyan-500/30">
                PASS PHOTO
              </div>
            </div>
          </div>

          {/* Attendee Details */}
          <div className="sm:col-span-2 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500">Attendee Name</span>
              <p className="text-base sm:text-lg font-bold text-white tracking-wide">{ticket.fullName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Attendee / Roll ID</span>
                <span className="text-cyan-300 font-semibold">{ticket.rollNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Level / Stage</span>
                <span className="text-slate-300">{ticket.year}</span>
              </div>
            </div>

            {ticket.collegeName && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Institution / Organization</span>
                <span className="text-xs text-slate-300 font-mono truncate block">{ticket.collegeName}</span>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Developer Track</span>
              <span className="text-xs text-sky-300 font-mono truncate block">{ticket.branch}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Email</span>
              <span className="text-xs text-slate-300 font-mono truncate block">{ticket.email}</span>
            </div>
          </div>
        </div>

        {/* QR Code & Barcode Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-dashed border-slate-800">
          {/* QR Code */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-cyan-500/30 shadow-md">
              {qrSrc ? (
                <img src={qrSrc} alt="Verification QR Code" className="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-mono">
                  Loading QR...
                </div>
              )}
            </div>
            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-500 block">OFFICIAL SCAN CODE</span>
              <span className="text-xs text-cyan-400 font-bold block">GATE SCAN ENCRYPTED</span>
              <span className="text-[10px] text-slate-400 block mt-1">Non-transferable</span>
              <span className="text-[9px] text-slate-600 block mt-0.5">SHA-256 Checksum</span>
            </div>
          </div>

          {/* Ticket ID & Barcode Graphic */}
          <div className="text-center sm:text-right font-mono">
            <span className="text-[10px] text-slate-500 block">UNIQUE TICKET NO.</span>
            <span className="text-sm font-bold text-white tracking-widest block bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
              {ticket.id}
            </span>

            {/* Simulated Vector Barcode */}
            <div className="mt-2 flex items-center justify-center sm:justify-end gap-[2px] h-6 opacity-80">
              {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 1, 2].map((w, i) => (
                <span
                  key={i}
                  style={{ width: `${w}px` }}
                  className={`h-full ${i % 2 === 0 ? 'bg-cyan-400' : 'bg-slate-400'}`}
                />
              ))}
            </div>
            <span className="text-[9px] text-slate-600 block mt-1">codersera.in // pass-token</span>
          </div>
        </div>
      </div>

      {/* Post generation guide */}
      <p className="mt-4 text-xs text-slate-500 font-mono text-center max-w-md">
        Present this digital pass or physical printout with QR code at the check-in gate.
      </p>
    </div>
  );
};
