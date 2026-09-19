import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Clock, 
  Search, 
  Code2, 
  GitBranch, 
  Users2, 
  GraduationCap,
  Sparkles,
  Ticket,
  ExternalLink,
} from 'lucide-react';
import { CommunityEvent } from '../types';

interface EventListProps {
  events: CommunityEvent[];
  onSelectEvent: (event: CommunityEvent) => void;
  onGoToLookup: () => void;
}

export const EventList: React.FC<EventListProps> = ({ events, onSelectEvent, onGoToLookup }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(events.map(e => e.category)))];

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.tags && event.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const flagshipEvent = events.find(e => e.isFeatured && e.isActive) || events.find(e => e.isActive) || events[0];

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-16">
      
      {/* SECTION 1: DEDICATED TICKET & PASS PORTAL HERO */}
      <section className="relative pt-4 pb-8 sm:py-12 border-b border-[#27272a]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Pill status badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-[#121215] border border-cyan-500/30 text-cyan-300 shadow-sm">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>CODERSERA EVENT PASS & REGISTRATION ENGINE</span>
            </div>

            {/* Signature Headline in Space Grotesk */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] font-display">
              Claim Your Pass for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400">
                CodersEra
              </span>{' '}
              Hackathons & Conclaves.
            </h1>

            {/* Subheading focused purely on ticketing and pass access */}
            <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Official digital credentials for CodersEra campus chapters. Featuring cryptographic anti-duplicate roll locking, interactive holographic badges, and instant gate pass check-in.
            </p>

            {/* Hero CTA buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#events-directory"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-[#09090b] font-bold text-sm shadow-[0_0_25px_rgba(56,189,248,0.3)] transition-all hover:scale-105 active:scale-95"
              >
                <Ticket className="w-4 h-4" />
                <span>Browse Active Passes</span>
              </a>

              <button
                id="hero-btn-find-pass"
                onClick={onGoToLookup}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#121215] hover:bg-white/5 border border-[#27272a] hover:border-cyan-400/50 text-slate-200 hover:text-white font-medium text-sm transition-all"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Find My Issued Pass</span>
              </button>

              <a
                href="https://www.codersera.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-slate-400 hover:text-cyan-300 text-xs font-mono transition-colors"
              >
                <span>codersera.in</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>

            {/* Live Pass Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#27272a]/60">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-slate-500">Security</span>
                <p className="text-xs font-mono font-bold text-slate-200">Roll No. Locked</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-slate-500">Pass Type</span>
                <p className="text-xs font-mono font-bold text-cyan-400">Verifiable QR</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-slate-500">Gate Check-in</span>
                <p className="text-xs font-mono font-bold text-emerald-400">1-Second Scan</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-slate-500">Host Chapter</span>
                <p className="text-xs font-mono font-bold text-slate-200">NIET Campus</p>
              </div>
            </div>

          </div>

          {/* Right Hero Graphic: Official CodersEra Dotted Emblem */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
              {/* Subtle ambient cyan glow */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl" />
              <img
                src="/dotted_logo.png"
                alt="Coders Era Emblem"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_35px_rgba(56,189,248,0.25)] select-none hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/codersera-logo-original.jpg';
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: OFFICIAL FLAGSHIP EVENT SPOTLIGHT (Automate India NIET Chapter 2026) */}
      {flagshipEvent && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Campus Initiative</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Registration Open
            </span>
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-[#121215] border border-[#27272a] hover:border-cyan-500/40 transition-all p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-xl">
            {/* Admin-managed event artwork */}
            <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-[#09090b] border border-white/5 aspect-video flex items-center justify-center">
              <img
                src={flagshipEvent.featuredImageUrl || '/automate-india.png'}
                alt={`${flagshipEvent.title} featured artwork`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const image = e.target as HTMLImageElement;
                  if (image.src.endsWith('/automate-india.png')) image.style.display = 'none';
                  else image.src = '/automate-india.png';
                }}
              />
            </div>

            {/* Event Description & CTA */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  Microsoft Azure Supported
                </span>
                <span className="px-3 py-1 rounded-md text-[11px] font-mono text-slate-400 bg-[#18181b] border border-[#27272a]">
                  Team Size: 2-3 Members
                </span>
                <span className="px-3 py-1 rounded-md text-[11px] font-mono text-slate-400 bg-[#18181b] border border-[#27272a]">
                  {flagshipEvent.generatedPasses ?? (flagshipEvent.totalSeats - flagshipEvent.availableSeats)} Passes Generated
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
                {flagshipEvent.title}
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                {flagshipEvent.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{flagshipEvent.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">{flagshipEvent.venue}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => onSelectEvent(flagshipEvent)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#09090b] font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all hover:scale-[1.02] active:scale-98"
                >
                  <span>Register & Claim Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: TICKET PASS ARCHITECTURE & CREDENTIAL FEATURES */}
      <section className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121215] border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CREDENTIAL SPECIFICATIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            How CodersEra Event Passes Work.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed mt-1">
            A student-first, tamper-resistant access protocol engineered for fast entrance scanning, verified team roles, and fair seat distribution.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-cyan-300 transition-colors font-display">
              Anti-Duplicate Roll Protection
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Each student roll number is strictly bound to one issued ticket, eliminating double claims and ensuring transparent capacity allocation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-cyan-300 transition-colors font-display">
              Holographic 3D Digital Badge
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Attendees receive an interactive 3D badge with dynamic light reflection, custom avatar selection, and verified participant status.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-cyan-300 transition-colors font-display">
              1-Second Gate QR Verification
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Venue gate volunteers can verify genuine passes instantly using any smartphone camera or the built-in offline QR check-in console.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-cyan-300 transition-colors font-display">
              Offline Wallet & Print Passes
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Export badges as high-res PNG images, print official physical conference credentials, or retrieve your pass anytime using your roll number.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: EVENTS DIRECTORY & TICKET PASS ALLOCATION */}
      <section id="events-directory" className="space-y-8 pt-4 border-t border-[#27272a]">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121215] border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
              <Ticket className="w-3.5 h-3.5" />
              <span>OFFICIAL EVENT PASSES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              Upcoming Events & Sprints
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Register for your verified developer access badge with offline QR scanning and anti-duplicate roll validation.
            </p>
          </div>

          <button
            id="btn-find-issued-ticket"
            onClick={onGoToLookup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#121215] border border-[#27272a] hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs font-mono transition-all self-start md:self-auto shadow-sm"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Find My Issued Ticket</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#121215] border border-[#27272a] text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, workshops..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl uppercase text-[10px] tracking-wider font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-[#09090b] font-bold'
                    : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#27272a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards Grid */}
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#121215] border border-[#27272a]">
            <p className="text-slate-400 text-sm">No events found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const seatsPercent = Math.min(
                100,
                Math.round(((event.generatedPasses ?? (event.totalSeats - event.availableSeats)) / event.totalSeats) * 100)
              );

              return (
                <div
                  key={event.id}
                  className="group relative rounded-2xl overflow-hidden bg-[#121215] border border-[#27272a] hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between p-6 shadow-md hover:shadow-[0_0_30px_rgba(56,189,248,0.1)]"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Header: Category + Seats */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-mono font-bold tracking-wider bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                        {event.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.generatedPasses ?? (event.totalSeats - event.availableSeats)} / {event.totalSeats} passes generated</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-2">
                      {event.tagline}
                    </p>

                    {/* Meta details */}
                    <div className="my-4 space-y-2 text-xs font-mono text-slate-300 border-y border-[#27272a] py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
                      {event.description}
                    </p>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {event.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181b] text-slate-400 border border-[#27272a]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Registration CTA */}
                  <div className="pt-4 mt-3 border-t border-[#27272a] space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Registration Status</span>
                        <span className="text-cyan-400 font-semibold">
                          {event.isActive ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Seats remaining</span>
                        <span className="text-emerald-400 font-semibold">{event.availableSeats} of {event.totalSeats}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#09090b] rounded-full overflow-hidden border border-[#27272a]">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all"
                          style={{ width: `${seatsPercent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      id={`register-btn-${event.id}`}
                      onClick={() => onSelectEvent(event)}
                      disabled={!event.isActive || event.availableSeats <= 0}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs font-mono transition-all ${
                        event.isActive && event.availableSeats > 0
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-[#09090b] shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:scale-[1.01]'
                          : 'bg-[#18181b] text-slate-500 cursor-not-allowed border border-[#27272a]'
                      }`}
                    >
                      <span>{event.isActive ? 'Get Event Pass' : 'Registrations Closed'}</span>
                      {event.isActive && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


    </div>
  );
};
