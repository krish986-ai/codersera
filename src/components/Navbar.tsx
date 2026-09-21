import React, { useState } from 'react';
import { 
  Moon, 
  Bell, 
  Github, 
  ShieldAlert, 
  Menu, 
  X,
  ExternalLink,
  Calendar,
  Users
} from 'lucide-react';
import { CodersEraLogo } from './CodersEraLogo';
interface NavbarProps {
  currentView: 'user-events' | 'user-register' | 'user-ticket' | 'user-lookup' | 'admin';
  setCurrentView: (view: 'user-events' | 'user-register' | 'user-ticket' | 'user-lookup' | 'admin') => void;
  adminAuthenticated: boolean;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  adminAuthenticated,
  onAdminLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Official CodersEra Brand Logo matching codersera.in */}
          <div 
            id="brand-logo"
            onClick={() => setCurrentView('user-events')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <CodersEraLogo size="md" subtitle="EVENT TICKETS & PASSES" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              Pass Portal
            </span>
          </div>

          {/* Center: Dedicated Ticket Portal Pill Navigation */}
          <nav 
            id="center-pill-navbar"
            className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-[#121215]/90 backdrop-blur-md px-2 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
          >
            {/* Events & Passes */}
            <button
              id="nav-pill-events"
              onClick={() => setCurrentView('user-events')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentView === 'user-events' || currentView === 'user-register'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Events & Passes
            </button>

            {/* Find My Ticket */}
            <button
              id="nav-pill-lookup"
              onClick={() => setCurrentView('user-lookup')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'user-lookup' || currentView === 'user-ticket'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Find My Pass
            </button>

            {/* Link back to Main CodersEra Website */}
            <a
              id="nav-pill-mainsite"
              href="https://www.codersera.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1"
              title="Return to official CodersEra website"
            >
              <span>Main Website</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            {/* Admin Console */}
            <button
              id="nav-pill-admin"
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                currentView === 'admin'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin</span>
              {adminAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Right: Action Controls matching codersera.in */}
          <div className="flex items-center gap-2.5">
            {/* Dark Mode Moon Indicator */}
            <div
              className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] flex items-center justify-center text-cyan-400 shrink-0"
              title="Dark Mode Active (Default)"
            >
              <Moon className="w-4 h-4" />
            </div>

            {/* Bell Notification with Cyan Indicator */}
            <div className="relative">
              <button
                id="nav-notification-btn"
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] hover:bg-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0 relative"
                title="Portal Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-[#121215] border border-[#27272a] shadow-2xl z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#27272a] mb-2.5">
                    <span className="font-bold text-white font-display">Portal Updates</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full font-mono">
                      Live
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    🚀 <strong>CodersEra 2026 Event Passes</strong> are active. Instant digital badges with QR codes are issued upon registration.
                  </p>
                </div>
              )}
            </div>

            {/* Official GitHub Link */}
            <a
              id="nav-github-link"
              href="https://github.com/CodersEraa"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-white/10 bg-[#121215] hover:bg-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
              title="CodersEra Official GitHub"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#27272a] space-y-2 text-xs animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                setCurrentView('user-events');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5"
            >
              Events & Passes
            </button>
            <button
              onClick={() => {
                setCurrentView('user-lookup');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-cyan-400 hover:bg-white/5 font-semibold"
            >
              Find My Ticket Pass
            </button>
            <a
              href="https://www.codersera.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5"
            >
              <span>Main Website (codersera.in)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              Admin Command Center
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
