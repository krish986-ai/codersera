import React, { useState } from 'react';
import { Search, Ticket, ArrowRight, AlertCircle } from 'lucide-react';
import { StudentTicket } from '../types';
import { findTicketsByEmail } from '../lib/storage';

interface TicketLookupProps {
  onSelectTicket: (ticket: StudentTicket) => void;
  onGoToEvents: () => void;
}

export const TicketLookup: React.FC<TicketLookupProps> = ({ onSelectTicket, onGoToEvents }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentTicket[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true); setSearchError('');
    try {
      const matches = await findTicketsByEmail(query.trim());
      setResults(matches);
      setHasSearched(true);
    } catch (error: unknown) {
      setSearchError(error instanceof Error ? error.message : 'Unable to search tickets.');
    } finally { setIsSearching(false); }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
          <Search className="w-5 h-5" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
          Find Your Event Pass
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          Already registered? Enter your email address, Attendee / Roll ID, or Pass ID to retrieve your digital badge.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 p-2 rounded-2xl bg-[#121215] border border-[#27272a] focus-within:border-cyan-400 transition-all shadow-lg">
          <input
            id="ticket-search-query-input"
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Email or Attendee / Roll ID"
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none"
          />
          <button
            id="ticket-search-submit-btn"
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#09090b] font-bold text-xs font-mono transition-all shrink-0"
          >
            <span>{isSearching ? 'Searching…' : 'Search'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
      {searchError && <p className="mb-4 text-center text-sm text-red-300">{searchError}</p>}

      {/* Results */}
      {hasSearched && results && (
        <div className="space-y-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Search Results ({results.length} Found)
          </h3>

          {results.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-white">No active ticket pass found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                We could not find an issued pass matching &quot;{query}&quot;. Please verify your Attendee / Roll ID or email, or claim a new pass below.
              </p>
              <button
                onClick={onGoToEvents}
                className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-[#09090b] text-xs font-bold font-mono hover:bg-cyan-400 transition-all"
              >
                Browse Events & Register
              </button>
            </div>
          ) : (
            results.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.01] group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      {ticket.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                    {ticket.eventTitle}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span>👤 {ticket.fullName}</span>
                    <span>🪪 {ticket.rollNumber}</span>
                    <span>{ticket.checkedIn ? '✅ Checked In' : '⏳ Pass Active'}</span>
                  </div>
                </div>

                <button
                  className="px-4 py-2 rounded-xl bg-cyan-500/15 group-hover:bg-cyan-500 group-hover:text-[#09090b] text-cyan-300 text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Open Badge</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
