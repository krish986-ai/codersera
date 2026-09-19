import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EventList } from './components/EventList';
import { RegistrationForm } from './components/RegistrationForm';
import { TicketBadge } from './components/TicketBadge';
import { TicketLookup } from './components/TicketLookup';
import { AdminPanel } from './components/AdminPanel';
import { GdprModal } from './components/GdprModal';
import { CommunityModal } from './components/CommunityModal';
import { InfoSectionModal, InfoModalType } from './components/InfoSectionModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { CommunityEvent, StudentTicket } from './types';
import { getStoredEvents, getStoredTickets } from './lib/storage';
import { ShieldCheck, Heart, Github, ExternalLink, Sparkles, ArrowLeft } from 'lucide-react';
import { CodersEraLogo } from './components/CodersEraLogo';

export default function App() {
  type AppView = 'user-events' | 'user-register' | 'user-ticket' | 'user-lookup' | 'admin';
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const view = window.history.state?.coderseraView as AppView | undefined;
    return view || 'user-events';
  });
  
  const [events, setEvents] = useState<CommunityEvent[]>(() => getStoredEvents());
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(() => events[0] || null);
  const [activeTicket, setActiveTicket] = useState<StudentTicket | null>(null);

  const navigateTo = (view: AppView, replace = false) => {
    if (view === currentView && !replace) return;
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ coderseraView: view }, '', window.location.href);
    setCurrentView(view);
  };

  useEffect(() => {
    if (!window.history.state?.coderseraView) {
      window.history.replaceState({ coderseraView: 'user-events' }, '', window.location.href);
    }
    const handleBrowserBack = () => {
      const view = window.history.state?.coderseraView as AppView | undefined;
      setCurrentView(view || 'user-events');
    };
    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, []);

  // Community & Info modals state
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);

  // Sync events whenever view changes
  useEffect(() => {
    setEvents(getStoredEvents());
  }, [currentView]);

  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((result: { authenticated?: boolean }) => setAdminAuthenticated(result.authenticated === true))
      .catch(() => setAdminAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  // GDPR Modal state
  const [gdprModalOpen, setGdprModalOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    setToasts((prev) => [newToast, ...prev]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch to register view for an event
  const handleSelectEvent = (event: CommunityEvent) => {
    setSelectedEvent(event);
    navigateTo('user-register');
  };

  // Called when student ticket is generated
  const handleTicketGenerated = (ticket: StudentTicket) => {
    setActiveTicket(ticket);
    navigateTo('user-ticket');
    addToast(
      'success',
      'Pass Issued Successfully',
      `Ticket #${ticket.id} generated for ${ticket.fullName} with verified QR code!`
    );
  };

  // View existing ticket
  const handleViewExistingTicket = (ticket: StudentTicket) => {
    setActiveTicket(ticket);
    navigateTo('user-ticket');
  };

  // Admin login handlers
  const handleAdminLoginSuccess = () => {
    setAdminAuthenticated(true);
    addToast('success', 'Admin Session Verified', 'Welcome to CodersEra Command Center.');
  };

  const handleAdminLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setAdminAuthenticated(false);
    navigateTo('user-events', true);
    addToast('info', 'Console Locked', 'Admin session has been terminated safely.');
  };

  return (
    <div className="min-h-screen bg-[#09090b] editorial-grid text-[#fafafa] flex flex-col selection:bg-cyan-400 selection:text-black">
      {/* Top CodersEra Navigation Bar matching codersera.in pill design */}
      <Navbar
        currentView={currentView}
        setCurrentView={navigateTo}
        adminAuthenticated={adminAuthenticated}
        onAdminLogout={handleAdminLogout}
        onOpenCommunityModal={() => setCommunityModalOpen(true)}
        onOpenInfoModal={(type) => setInfoModalType(type)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full pb-16">
        {currentView !== 'user-events' && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#27272a] bg-[#121215] text-slate-300 hover:text-white hover:border-cyan-500/50 text-xs font-mono transition-all"
              aria-label="Go back to the previous page"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
        {!authChecked && currentView === 'admin' && (
          <div className="max-w-md mx-auto py-16 px-4 text-center text-sm text-slate-400">Checking secure session…</div>
        )}
        {currentView === 'user-events' && (
          <EventList
            events={events}
            onSelectEvent={handleSelectEvent}
            onGoToLookup={() => navigateTo('user-lookup')}
          />
        )}

        {currentView === 'user-register' && selectedEvent && (
          <RegistrationForm
            selectedEvent={selectedEvent}
            onTicketGenerated={handleTicketGenerated}
            onViewExistingTicket={handleViewExistingTicket}
            onCancel={() => navigateTo('user-events')}
          />
        )}

        {currentView === 'user-ticket' && activeTicket && (
          <TicketBadge
            ticket={activeTicket}
            onBack={() => navigateTo('user-events')}
            showBackBtn={true}
          />
        )}

        {currentView === 'user-lookup' && (
          <TicketLookup
            onSelectTicket={(t) => {
              setActiveTicket(t);
              navigateTo('user-ticket');
            }}
            onGoToEvents={() => navigateTo('user-events')}
          />
        )}

        {currentView === 'admin' && authChecked && (
          <AdminPanel
            isAuthenticated={adminAuthenticated}
            onLoginSuccess={handleAdminLoginSuccess}
            onLogout={handleAdminLogout}
            onViewTicket={(t) => {
              setActiveTicket(t);
              navigateTo('user-ticket');
            }}
          />
        )}
      </main>

      {/* Authentic Footer matching codersera.in */}
      <footer className="border-t border-[#27272a] bg-[#09090b]/95 backdrop-blur-sm py-12 px-4 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#27272a]">
            <div className="space-y-2 max-w-md">
              <CodersEraLogo size="md" subtitle="EVENT TICKETS & PASSES" />
              <p className="text-slate-400 text-xs leading-relaxed pt-1">
                Official digital pass generation, cryptographic anti-duplicate roll validation, and gate verification engine for CodersEra hackathons, tech summits, and campus chapters.
              </p>
            </div>

            {/* Social Icons matching official site */}
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/CODERS_ERA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] hover:bg-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Twitter / X (@CODERS_ERA)"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              <a
                href="https://github.com/CodersEraa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] hover:bg-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="GitHub (@CodersEraa)"
              >
                <Github className="w-4 h-4" />
              </a>

              <a
                href="https://www.linkedin.com/in/coder-s-era-community-012b2b375/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] hover:bg-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              <a
                href="https://www.instagram.com/coders__eraa/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] hover:bg-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
            <p className="text-slate-500">
              © {new Date().getFullYear()} CodersEra Community • Built by developers, for developers.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <button
                onClick={() => setCommunityModalOpen(true)}
                className="text-cyan-400 hover:underline transition-colors"
              >
                Join Community
              </button>
              <span>•</span>
              <button
                onClick={() => setGdprModalOpen(true)}
                className="hover:text-cyan-400 transition-colors"
              >
                Privacy & Pass Policy
              </button>
              <span>•</span>
              <a
                href="https://www.codersera.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <span>codersera.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <button
                onClick={() => navigateTo('admin')}
                className="hover:text-cyan-400 text-slate-400 transition-colors"
              >
                Admin Command Center
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Push Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />

      {/* GDPR Modal */}
      <GdprModal isOpen={gdprModalOpen} onClose={() => setGdprModalOpen(false)} />

      {/* Join Community Modal */}
      <CommunityModal isOpen={communityModalOpen} onClose={() => setCommunityModalOpen(false)} />

      {/* About / Gallery / Team / Contact Info Modal */}
      <InfoSectionModal type={infoModalType} onClose={() => setInfoModalType(null)} />
    </div>
  );
}
