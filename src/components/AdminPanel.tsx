import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Lock, Users, Calendar, Download, Search, Filter, 
  Trash2, Edit3, Image, RefreshCw, CheckCircle2, XCircle, 
  Sparkles, Database, Plus, Eye, KeyRound, AlertTriangle, ArrowUpDown, 
  QrCode, Check, ToggleLeft, ToggleRight, X, Clock, MapPin, Tag,
  ExternalLink, HelpCircle, Info, ClipboardPaste, Globe, CheckCheck,
  Copy, Cloud, ArrowUpRight
} from 'lucide-react';
import { CommunityEvent, StudentTicket, FilterOptions, Branch, AcademicYear } from '../types';
import { 
  getStoredEvents, saveEvents, getStoredTickets, saveTickets, 
  toggleTicketCheckIn, cleanupAttendeeImages, updateStudentTicket, deleteStudentTicket,
  addCommunityEvent, updateCommunityEvent, deleteCommunityEvent, toggleEventStatus
} from '../lib/storage';
import { exportTicketsToCsv } from '../lib/exportExcel';
import { SecondaryAuthModal } from './SecondaryAuthModal';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  clearStoredFirebaseConfig, 
  testFirestoreConnection, 
  FirebaseTestResult, 
  sanitizeConfigValue,
  syncAllTicketsToCloud,
  fetchTicketsFromCloud
} from '../lib/firebaseConfig';
import { CodersEraLogo } from './CodersEraLogo';

interface AdminPanelProps {
  isAuthenticated: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onViewTicket: (ticket: StudentTicket) => void;
}

const EVENT_CATEGORIES = [
  'Hackathon',
  'Workshop',
  'DevCon',
  'Bootcamp',
  'Meetup',
  'Tech Summit',
  'Code Sprint',
] as const;

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAuthenticated,
  onLoginSuccess,
  onLogout,
  onViewTicket,
}) => {
  // Login State (First Lock password: @@cd_tic.1215)
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'attendees' | 'events' | 'scanner' | 'firebase'>('events');

  // Data states
  const [events, setEvents] = useState<CommunityEvent[]>(() => getStoredEvents());
  const [tickets, setTickets] = useState<StudentTicket[]>(() => getStoredTickets());

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checkedIn' | 'pending'>('all');

  // Secondary Auth State (Master password: @#cde_09)
  const [secondaryAuthOpen, setSecondaryAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete' | 'cleanup' | 'delete_event';
    ticketId?: string;
    eventId?: string;
    payload?: Partial<StudentTicket>;
  } | null>(null);

  // Edit Student Modal state
  const [editingTicket, setEditingTicket] = useState<StudentTicket | null>(null);

  // Event Management Modal State (Add / Edit)
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    tagline: '',
    category: 'Hackathon' as typeof EVENT_CATEGORIES[number],
    date: '',
    time: '',
    venue: '',
    totalSeats: 250,
    availableSeats: 250,
    description: '',
    isActive: true,
    tags: 'Web3, AI, FullStack',
  });
  const [eventFormError, setEventFormError] = useState('');

  // Scanner Simulator
  const [scannedCode, setScannedCode] = useState('');
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'not-found' | 'already-checked'; ticket?: StudentTicket } | null>(null);

  // Notifications
  const [cleanupMessage, setCleanupMessage] = useState('');
  const [eventActionSuccess, setEventActionSuccess] = useState('');

  // Firebase Config Form
  const [fbApiKey, setFbApiKey] = useState(() => getStoredFirebaseConfig()?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(() => getStoredFirebaseConfig()?.projectId || '');
  const [fbAppId, setFbAppId] = useState(() => getStoredFirebaseConfig()?.appId || '');
  const [fbTestStatus, setFbTestStatus] = useState<string>('');
  const [fbTestResult, setFbTestResult] = useState<FirebaseTestResult | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState('');
  const [showSnippetPaste, setShowSnippetPaste] = useState(false);
  const [snippetInput, setSnippetInput] = useState('');
  const [snippetError, setSnippetError] = useState('');

  // Refresh local data
  const refreshData = () => {
    setEvents(getStoredEvents());
    setTickets(getStoredTickets());
  };

  // First Lock Authentication check: @@cd_tic.1215
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (passwordInput === '@@cd_tic.1215') {
      onLoginSuccess();
      setPasswordInput('');
    } else {
      setLoginError('Invalid Administrator Access Password. Access denied.');
    }
  };

  // Filtered tickets sheet
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Event filter
      if (selectedEventId !== 'all' && t.eventId !== selectedEventId) return false;
      // Branch filter
      if (branchFilter !== 'all' && t.branch !== branchFilter) return false;
      // Year filter
      if (yearFilter !== 'all' && t.year !== yearFilter) return false;
      // Check in filter
      if (checkInFilter === 'checkedIn' && !t.checkedIn) return false;
      if (checkInFilter === 'pending' && t.checkedIn) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.fullName.toLowerCase().includes(q);
        const matchEmail = t.email.toLowerCase().includes(q);
        const matchRoll = t.rollNumber.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRoll && !matchId) return false;
      }
      return true;
    });
  }, [tickets, selectedEventId, branchFilter, yearFilter, checkInFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = tickets.length;
    const checkedIn = tickets.filter(t => t.checkedIn).length;
    const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    return { total, checkedIn, rate };
  }, [tickets]);

  // Handle Export Excel / CSV
  const handleExportCsv = () => {
    const eventName = selectedEventId !== 'all' 
      ? events.find(e => e.id === selectedEventId)?.title.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'
      : 'All_Events';
    exportTicketsToCsv(filteredTickets, `CodersEra_${eventName}_Attendees.csv`);
  };

  // Toggle CheckIn
  const handleCheckInToggle = (ticketId: string) => {
    toggleTicketCheckIn(ticketId);
    refreshData();
  };

  // Trigger Scanner Verification
  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode.trim()) return;

    const raw = scannedCode.trim();
    const ticketId = raw.includes('|') ? raw.split('|')[0] : raw;

    const found = tickets.find(t => t.id.toLowerCase() === ticketId.toLowerCase());
    if (!found) {
      setScanResult({ status: 'not-found' });
      return;
    }

    if (found.checkedIn) {
      setScanResult({ status: 'already-checked', ticket: found });
    } else {
      toggleTicketCheckIn(found.id);
      refreshData();
      setScanResult({ status: 'success', ticket: { ...found, checkedIn: true, checkedInAt: new Date().toISOString() } });
    }
  };

  // Request Secondary Auth for image cleanup
  const requestImageCleanup = () => {
    setPendingAction({ type: 'cleanup' });
    setSecondaryAuthOpen(true);
  };

  // Request Secondary Auth for student delete
  const requestDeleteStudent = (ticketId: string) => {
    setPendingAction({ type: 'delete', ticketId });
    setSecondaryAuthOpen(true);
  };

  // Request Secondary Auth for event delete
  const requestDeleteEvent = (eventId: string) => {
    setPendingAction({ type: 'delete_event', eventId });
    setSecondaryAuthOpen(true);
  };

  // Request Secondary Auth for student edit
  const requestEditStudent = (ticket: StudentTicket) => {
    setEditingTicket(ticket);
  };

  // Executes after Secondary Auth password (@#cde_09) is approved
  const executeAuthorizedAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'cleanup') {
      const count = cleanupAttendeeImages(selectedEventId === 'all' ? undefined : selectedEventId);
      refreshData();
      setCleanupMessage(`Successfully cleaned up ${count} attendee photos to save server storage.`);
      setTimeout(() => setCleanupMessage(''), 5000);
    } else if (pendingAction.type === 'delete' && pendingAction.ticketId) {
      deleteStudentTicket(pendingAction.ticketId);
      refreshData();
    } else if (pendingAction.type === 'delete_event' && pendingAction.eventId) {
      deleteCommunityEvent(pendingAction.eventId);
      refreshData();
      setEventActionSuccess('Event removed successfully from database.');
      setTimeout(() => setEventActionSuccess(''), 4000);
    }

    setPendingAction(null);
  };

  // Save student edit with secondary auth verification
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    updateStudentTicket(editingTicket.id, editingTicket);
    refreshData();
    setEditingTicket(null);
  };

  // Open Create Event Modal
  const handleOpenCreateEvent = () => {
    setEditingEventId(null);
    setEventFormData({
      title: '',
      tagline: '',
      category: 'Hackathon',
      date: 'Saturday, Nov 14, 2026',
      time: '09:00 AM - 06:00 PM',
      venue: 'Main Tech Center & Virtual Live',
      totalSeats: 300,
      availableSeats: 300,
      description: 'Join developers, builders, and designers for an intensive engineering session with CodersEra.',
      isActive: true,
      tags: 'FullStack, AI, OpenSource',
    });
    setEventFormError('');
    setEventModalOpen(true);
  };

  // Open Edit Event Modal
  const handleOpenEditEvent = (evt: CommunityEvent) => {
    setEditingEventId(evt.id);
    setEventFormData({
      title: evt.title,
      tagline: evt.tagline,
      category: (EVENT_CATEGORIES.includes(evt.category as any) ? evt.category : 'Hackathon') as any,
      date: evt.date,
      time: evt.time,
      venue: evt.venue,
      totalSeats: evt.totalSeats,
      availableSeats: evt.availableSeats,
      description: evt.description,
      isActive: evt.isActive,
      tags: evt.tags ? evt.tags.join(', ') : '',
    });
    setEventFormError('');
    setEventModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEventFormError('');

    if (!eventFormData.title.trim() || !eventFormData.venue.trim() || !eventFormData.date.trim()) {
      setEventFormError('Please fill in required fields (Title, Date, Venue).');
      return;
    }

    const tagsArray = eventFormData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingEventId) {
      // Update existing
      updateCommunityEvent(editingEventId, {
        title: eventFormData.title.trim(),
        tagline: eventFormData.tagline.trim(),
        category: eventFormData.category,
        date: eventFormData.date.trim(),
        time: eventFormData.time.trim(),
        venue: eventFormData.venue.trim(),
        totalSeats: Number(eventFormData.totalSeats),
        availableSeats: Number(eventFormData.availableSeats),
        description: eventFormData.description.trim(),
        isActive: eventFormData.isActive,
        tags: tagsArray,
      });
      setEventActionSuccess(`Event "${eventFormData.title}" updated successfully.`);
    } else {
      // Add new
      addCommunityEvent({
        title: eventFormData.title.trim(),
        tagline: eventFormData.tagline.trim(),
        category: eventFormData.category,
        date: eventFormData.date.trim(),
        time: eventFormData.time.trim(),
        venue: eventFormData.venue.trim(),
        totalSeats: Number(eventFormData.totalSeats),
        availableSeats: Number(eventFormData.availableSeats),
        description: eventFormData.description.trim(),
        isActive: eventFormData.isActive,
        tags: tagsArray,
      });
      setEventActionSuccess(`New event "${eventFormData.title}" created successfully.`);
    }

    refreshData();
    setEventModalOpen(false);
    setTimeout(() => setEventActionSuccess(''), 4000);
  };

  // Quick Toggle Event Active Status
  const handleToggleEventStatus = (eventId: string) => {
    toggleEventStatus(eventId);
    refreshData();
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApiKey = sanitizeConfigValue(fbApiKey);
    const cleanProjectId = sanitizeConfigValue(fbProjectId);
    const cleanAppId = sanitizeConfigValue(fbAppId);

    if (!cleanApiKey || !cleanProjectId) {
      setFbTestStatus('Please enter at least the API Key and Project ID.');
      return;
    }
    const cfg = {
      apiKey: cleanApiKey,
      projectId: cleanProjectId,
      appId: cleanAppId,
      authDomain: `${cleanProjectId}.firebaseapp.com`,
      storageBucket: `${cleanProjectId}.firebasestorage.app`,
      messagingSenderId: '1234567890',
    };
    saveStoredFirebaseConfig(cfg);
    setFbApiKey(cleanApiKey);
    setFbProjectId(cleanProjectId);
    setFbAppId(cleanAppId);
    setFbTestStatus('✓ Firebase credentials saved locally. Click "Test Connection" to verify live Firestore reachability.');
  };

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    setFbTestResult(null);
    setFbTestStatus('Probing Google Cloud Firestore & testing handshake...');

    const cleanApiKey = sanitizeConfigValue(fbApiKey);
    const cleanProjectId = sanitizeConfigValue(fbProjectId);
    const cleanAppId = sanitizeConfigValue(fbAppId);

    if (!cleanApiKey || !cleanProjectId) {
      setIsTestingFirebase(false);
      setFbTestResult({
        success: false,
        status: 'error',
        title: 'Missing Required Credentials',
        message: 'Please fill in both the API Key and Project ID before testing.',
        suggestedAction: 'Enter your Firebase API Key and Project ID in the fields above.',
      });
      setFbTestStatus('Please fill in both API Key and Project ID.');
      return;
    }

    const cfgToTest = {
      apiKey: cleanApiKey,
      projectId: cleanProjectId,
      appId: cleanAppId,
      authDomain: `${cleanProjectId}.firebaseapp.com`,
      storageBucket: `${cleanProjectId}.firebasestorage.app`,
      messagingSenderId: '1234567890',
    };

    const res = await testFirestoreConnection(cfgToTest);
    setIsTestingFirebase(false);
    setFbTestResult(res);
    setFbTestStatus(res.message);

    if (res.success) {
      // Auto-save on verified connection so the user never has to re-enter
      saveStoredFirebaseConfig(cfgToTest);
      setFbApiKey(cleanApiKey);
      setFbProjectId(cleanProjectId);
      setFbAppId(cleanAppId);
    }
  };

  const handleCopyRules = (rulesText: string) => {
    navigator.clipboard.writeText(rulesText);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 3000);
  };

  const handleSyncTicketsToCloud = async () => {
    setIsSyncingCloud(true);
    setCloudSyncMsg('Uploading local tickets to Cloud Firestore...');
    const res = await syncAllTicketsToCloud(tickets);
    setIsSyncingCloud(false);
    if (res.success) {
      setCloudSyncMsg(`✓ Successfully synced ${res.count} tickets to Cloud Firestore!`);
    } else {
      setCloudSyncMsg(`Failed to sync: ${res.error}`);
    }
    setTimeout(() => setCloudSyncMsg(''), 6000);
  };

  const handlePullTicketsFromCloud = async () => {
    setIsSyncingCloud(true);
    setCloudSyncMsg('Pulling tickets from Cloud Firestore...');
    const res = await fetchTicketsFromCloud();
    setIsSyncingCloud(false);
    if (res.success && res.tickets.length > 0) {
      const existing = getStoredTickets();
      const existingIds = new Set(existing.map(t => t.id));
      const newFromCloud = res.tickets.filter(t => !existingIds.has(t.id));
      const merged = [...existing, ...newFromCloud];
      saveTickets(merged);
      refreshData();
      setCloudSyncMsg(`✓ Pulled ${res.tickets.length} tickets from Cloud Firestore (${newFromCloud.length} new records imported).`);
    } else if (res.success && res.tickets.length === 0) {
      setCloudSyncMsg('Cloud Firestore collection "tickets" is currently empty.');
    } else {
      setCloudSyncMsg(`Cloud pull failed: ${res.error}`);
    }
    setTimeout(() => setCloudSyncMsg(''), 6000);
  };

  const handleParseSnippet = () => {
    setSnippetError('');
    if (!snippetInput.trim()) {
      setSnippetError('Please paste your Firebase config snippet or JSON.');
      return;
    }

    try {
      // Regex extraction for apiKey, projectId, appId
      const apiKeyMatch = snippetInput.match(/apiKey["']?\s*:\s*["']([^"']+)["']/i);
      const projectIdMatch = snippetInput.match(/projectId["']?\s*:\s*["']([^"']+)["']/i);
      const appIdMatch = snippetInput.match(/appId["']?\s*:\s*["']([^"']+)["']/i);

      let found = false;
      if (apiKeyMatch && apiKeyMatch[1]) {
        setFbApiKey(sanitizeConfigValue(apiKeyMatch[1]));
        found = true;
      }
      if (projectIdMatch && projectIdMatch[1]) {
        setFbProjectId(sanitizeConfigValue(projectIdMatch[1]));
        found = true;
      }
      if (appIdMatch && appIdMatch[1]) {
        setFbAppId(sanitizeConfigValue(appIdMatch[1]));
        found = true;
      }

      if (!found) {
        // Attempt standard JSON parsing
        const parsed = JSON.parse(snippetInput);
        if (parsed.apiKey) setFbApiKey(sanitizeConfigValue(String(parsed.apiKey)));
        if (parsed.projectId) setFbProjectId(sanitizeConfigValue(String(parsed.projectId)));
        if (parsed.appId) setFbAppId(sanitizeConfigValue(String(parsed.appId)));
        found = Boolean(parsed.apiKey || parsed.projectId || parsed.appId);
      }

      if (found) {
        setShowSnippetPaste(false);
        setSnippetInput('');
        setFbTestResult(null);
        setFbTestStatus('✓ Extracted API Key, Project ID, and App ID from snippet! Click "Test Connection" to verify.');
      } else {
        setSnippetError('Could not find apiKey, projectId, or appId in pasted text. Please verify or fill manually.');
      }
    } catch {
      setSnippetError('Could not parse snippet. Please copy the apiKey, projectId, and appId values directly into the input fields.');
    }
  };

  const handleResetToLocalStorage = () => {
    clearStoredFirebaseConfig();
    setFbApiKey('');
    setFbProjectId('');
    setFbAppId('');
    setFbTestResult(null);
    setFbTestStatus('✓ Cloud credentials cleared. Platform is running in pure offline LocalStorage mode.');
  };

  // IF NOT AUTHENTICATED: Show password lock screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-[#121215] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-white font-display">CodersEra Admin Console</h2>
          <p className="text-xs text-slate-400 mt-1">
            Event Pass Operations & Gate Access
          </p>

          <div className="my-4 p-3 rounded-xl bg-[#18181b] border border-[#27272a] text-[11px] font-mono text-slate-400">
            Protected Gateway • Authorization Key Required
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <input
                id="admin-password-input"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (@@cd_tic.1215)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#18181b] border border-[#27272a] text-white placeholder:text-slate-500 text-sm focus:border-cyan-400 focus:outline-none font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all font-mono"
            >
              Access Dashboard
            </button>
          </form>

          <p className="mt-4 text-[10px] text-slate-500 font-mono">
            Default pass: <code className="text-cyan-400">@@cd_tic.1215</code>
          </p>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#121215] border border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-display">Event Pass Operations & Gate Console</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              CodersEra Official Event Passes, Capacity & Gate Verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-refresh-data-btn"
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-slate-300 text-xs font-mono border border-[#27272a] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="admin-logout-btn"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-red-950 text-slate-300 hover:text-red-300 text-xs font-mono border border-[#27272a] transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Action Success / Cleanup Alerts */}
      {cleanupMessage && (
        <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{cleanupMessage}</span>
        </div>
      )}

      {eventActionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{eventActionSuccess}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Events</span>
          <span className="text-2xl font-bold text-white mt-1 block font-display">{events.length}</span>
          <span className="text-[10px] text-cyan-400 font-mono mt-0.5 block">
            {events.filter(e => e.isActive).length} Open for registration
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Issued Passes</span>
          <span className="text-2xl font-bold text-cyan-400 mt-1 block font-display">{stats.total}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Verified digital passes</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Checked In at Gates</span>
          <span className="text-2xl font-bold text-white mt-1 block font-display">{stats.checkedIn}</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">{stats.rate}% Attendance Rate</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Pending Check-in</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block font-display">{stats.total - stats.checkedIn}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Awaiting physical entry</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#27272a] pb-2 overflow-x-auto">
        <button
          id="tab-events-btn"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'events'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
              : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Events Control ({events.length})</span>
        </button>

        <button
          id="tab-attendees-btn"
          onClick={() => setActiveTab('attendees')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'attendees'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
              : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pass Holders Sheet ({filteredTickets.length})</span>
        </button>

        <button
          id="tab-scanner-btn"
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'scanner'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
              : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Gate Scanner</span>
        </button>

        <button
          id="tab-firebase-btn"
          onClick={() => setActiveTab('firebase')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'firebase'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
              : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cloud / Firebase</span>
        </button>
      </div>

      {/* TAB 1: EVENT CONTROL & MANAGEMENT (ADD / EDIT / DELETE / TOGGLE) */}
      {activeTab === 'events' && (
        <div className="space-y-5">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121215] border border-[#27272a]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Event Catalog Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add new community events, manage dates/seat quotas, toggle registration status, or view attendee lists.
              </p>
            </div>

            <button
              id="admin-add-event-btn"
              onClick={handleOpenCreateEvent}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => {
              const enrolledCount = tickets.filter(t => t.eventId === evt.id).length;
              const fillPercentage = Math.min(100, Math.round((enrolledCount / evt.totalSeats) * 100));

              return (
                <div
                  key={evt.id}
                  className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Tag & Status Toggle */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                        {evt.category}
                      </span>
                      
                      <button
                        onClick={() => handleToggleEventStatus(evt.id)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 transition-all ${
                          evt.isActive
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                            : 'bg-[#18181b] text-slate-400 border border-[#27272a] hover:bg-[#27272a]'
                        }`}
                        title="Click to toggle Open / Closed status"
                      >
                        {evt.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Registration Open</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Closed</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-white font-display">{evt.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{evt.tagline}</p>

                    {/* Metadata details */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-400 font-mono bg-[#18181b] p-3 rounded-xl border border-[#27272a]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {evt.tags && evt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {evt.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181b] text-slate-400 border border-[#27272a]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enrollment Progress & Control Buttons */}
                  <div className="pt-3 border-t border-[#27272a] space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-slate-400">Capacity & Enrolled</span>
                        <span className="font-bold text-cyan-400">
                          {enrolledCount} / {evt.totalSeats} ({fillPercentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
                      <button
                        onClick={() => {
                          setSelectedEventId(evt.id);
                          setActiveTab('attendees');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 text-center transition-all text-[11px]"
                      >
                        View Passes ({enrolledCount})
                      </button>

                      <button
                        onClick={() => handleOpenEditEvent(evt)}
                        className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white border border-[#27272a] transition-all"
                        title="Edit Event Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => requestDeleteEvent(evt.id)}
                        className="p-1.5 rounded-lg bg-[#18181b] hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-[#27272a] transition-all"
                        title="Delete Event (Requires Master Key)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDEE SHEET & EXCEL EXPORT */}
      {activeTab === 'attendees' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  id="attendee-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Roll No, Email, or Pass ID..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-white placeholder:text-slate-500 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="export-csv-btn"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel / CSV</span>
                </button>

                <button
                  id="cleanup-images-btn"
                  onClick={requestImageCleanup}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-amber-950 text-slate-300 hover:text-amber-300 text-xs font-mono border border-[#27272a] transition-all"
                  title="Purge attendee photos to free up storage space"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Purge Photos</span>
                </button>
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#27272a] font-mono text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Filter Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-slate-300 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All Events ({tickets.length})</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Gate Check-in Status</label>
                <select
                  value={checkInFilter}
                  onChange={(e) => setCheckInFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-slate-300 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="checkedIn">Checked In Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Developer Track</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-slate-300 text-xs focus:border-cyan-400 focus:outline-none truncate"
                >
                  <option value="all">All Tracks</option>
                  <option value="Full Stack & Web Development">Full Stack & Web</option>
                  <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
                  <option value="Blockchain & Web3 Engineering">Blockchain & Web3</option>
                  <option value="Cloud Computing & DevOps">Cloud & DevOps</option>
                  <option value="Cybersecurity & Systems">Cybersecurity & Systems</option>
                  <option value="Computer Science & Engineering (CSE)">CSE</option>
                  <option value="Information Technology (IT)">IT</option>
                  <option value="UI/UX & Product Design">UI/UX & Product</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Stage / Level</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-slate-300 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All Stages</option>
                  <option value="1st / 2nd Year Student">1st / 2nd Year</option>
                  <option value="3rd / 4th Year Student">3rd / 4th Year</option>
                  <option value="Master's / Postgraduate">Master's / Postgrad</option>
                  <option value="Self-Taught / Professional">Professional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attendee Table */}
          <div className="rounded-2xl bg-[#121215] border border-[#27272a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#18181b] border-b border-[#27272a] text-slate-400">
                    <th className="py-3 px-4">Pass ID</th>
                    <th className="py-3 px-4">Attendee Name</th>
                    <th className="py-3 px-4">Roll / Student ID</th>
                    <th className="py-3 px-4">Track & Stage</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Badge</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/60">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No attendees found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-[#18181b]/50 transition-colors">
                        {/* Ticket ID */}
                        <td className="py-3 px-4 font-bold text-cyan-400">
                          {t.id}
                        </td>

                        {/* Name & Email */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{t.fullName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{t.email}</div>
                        </td>

                        {/* Roll Number */}
                        <td className="py-3 px-4 text-cyan-300 font-bold">
                          {t.rollNumber}
                        </td>

                        {/* Branch & Year */}
                        <td className="py-3 px-4">
                          <div className="truncate max-w-[180px] text-slate-200" title={t.branch}>
                            {t.branch}
                          </div>
                          <div className="text-[10px] text-slate-500">{t.year}</div>
                        </td>

                        {/* Event Name */}
                        <td className="py-3 px-4">
                          <div className="truncate max-w-[160px] text-slate-300" title={t.eventTitle}>
                            {t.eventTitle}
                          </div>
                        </td>

                        {/* Check-in toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleCheckInToggle(t.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              t.checkedIn
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-red-950 hover:text-red-300 hover:border-red-500/40'
                                : 'bg-[#18181b] text-slate-400 border-[#27272a] hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-500/40'
                            }`}
                            title="Click to toggle attendance check-in"
                          >
                            {t.checkedIn ? 'CHECKED IN' : 'PENDING'}
                          </button>
                        </td>

                        {/* Photo state */}
                        <td className="py-3 px-4 text-center">
                          {t.photoBase64 && !t.isPhotoCleanedUp ? (
                            <img
                              src={t.photoBase64}
                              alt={t.fullName}
                              className="w-8 h-8 rounded-full object-cover mx-auto border border-cyan-400"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-500">
                              {t.isPhotoCleanedUp ? 'Purged' : 'None'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewTicket(t)}
                              className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-cyan-400"
                              title="View Digital Pass"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => requestEditStudent(t)}
                              className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-amber-400"
                              title="Edit Attendee Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => requestDeleteStudent(t.id)}
                              className="p-1.5 rounded-lg bg-[#18181b] hover:bg-red-950 text-red-400"
                              title="Delete Record (Requires @#cde_09)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GATE SCANNER SIMULATOR */}
      {activeTab === 'scanner' && (
        <div className="max-w-2xl mx-auto py-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">Entry Gate Pass Scanner</h3>
            <p className="text-xs text-slate-400 mt-1">
              Scan attendee QR code or type Ticket Number to verify entry and log gate attendance.
            </p>

            <form onSubmit={handleManualScan} className="mt-5 flex gap-2">
              <input
                id="scanner-ticket-input"
                type="text"
                required
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scan or enter Pass ID (e.g. CE-2026-9142-X7)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white font-mono text-sm focus:border-cyan-400 focus:outline-none uppercase"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shrink-0"
              >
                Verify & Check-in
              </button>
            </form>
          </div>

          {/* Scan Result Box */}
          {scanResult && (
            <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a]">
              {scanResult.status === 'not-found' && (
                <div className="flex items-center gap-3 text-red-400 font-mono text-xs">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span>No pass found matching the scanned payload. Fraudulent or non-existent pass.</span>
                </div>
              )}

              {scanResult.status === 'already-checked' && scanResult.ticket && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-white font-display">Already Checked In!</h4>
                      <p className="text-xs font-mono mt-1">
                        Attendee {scanResult.ticket.fullName} ({scanResult.ticket.rollNumber}) already checked in earlier at {scanResult.ticket.checkedInAt ? new Date(scanResult.ticket.checkedInAt).toLocaleTimeString() : 'Entry Gate'}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {scanResult.status === 'success' && scanResult.ticket && (
                <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-white font-display">Entry Authorized & Checked In</h4>
                        <span className="text-[10px] font-mono bg-emerald-900 px-2 py-0.5 rounded text-emerald-300">
                          VALID PASS
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px]">ATTENDEE</span>
                          <span className="font-bold text-white">{scanResult.ticket.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ROLL / ID</span>
                          <span className="text-cyan-300 font-bold">{scanResult.ticket.rollNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">TRACK</span>
                          <span className="text-slate-200 truncate block">{scanResult.ticket.branch}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">STAGE</span>
                          <span className="text-slate-200">{scanResult.ticket.year}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FIREBASE & CLOUD PERSISTENCE CONFIG */}
      {activeTab === 'firebase' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#121215] border border-[#27272a] space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                    <span>Cloud Database & Firebase Setup</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                      OPTIONAL
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect an external Firebase Firestore cloud database for real-time sync across devices.
                  </p>
                </div>
              </div>

              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-cyan-400 hover:text-cyan-300 border border-[#27272a] text-xs font-mono transition-all shrink-0"
              >
                <span>Open Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Local Storage Default Status Callout */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs font-mono">
                  <p className="font-bold text-emerald-300">
                    Local Storage Engine is Active & 100% Ready (No Firebase Required)
                  </p>
                  <p className="text-emerald-200/80 mt-1 leading-relaxed">
                    You do <strong>not</strong> need to fill in these values to manage events. CodersEra stores all events, registrations, digital passes, QR codes, entry scanning, and Excel exports directly in your browser's persistent storage. Firebase is purely an optional enhancement if you want real-time cloud multi-device sync.
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation Guide: What these values mean & how to get them */}
            <div className="p-5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-4">
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>What do these values mean?</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#121215] border border-[#27272a]">
                  <span className="text-cyan-400 font-bold block mb-1">1. API Key</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    A public client token created by Google (e.g. <code className="text-slate-300 bg-[#18181b] px-1 rounded">AIzaSy...</code>). It authenticates web requests from this app to your Firebase database.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#121215] border border-[#27272a]">
                  <span className="text-cyan-400 font-bold block mb-1">2. Project ID</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    The unique project name identifier you chose when creating your Firebase project (e.g. <code className="text-slate-300 bg-[#18181b] px-1 rounded">codersera-tickets</code>).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#121215] border border-[#27272a]">
                  <span className="text-cyan-400 font-bold block mb-1">3. App ID</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    The web application identifier assigned by Firebase (e.g. <code className="text-slate-300 bg-[#18181b] px-1 rounded">1:123456789:web:abcdef</code>). Links this web frontend to the cloud project.
                  </p>
                </div>
              </div>

              {/* How to get them steps */}
              <div className="pt-3 border-t border-[#27272a] space-y-2">
                <span className="text-slate-300 font-bold text-xs font-mono block">
                  How can you get these values? (Free from Google in 2 minutes):
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400 font-mono">
                  <li>
                    Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">console.firebase.google.com</a> and sign in with your Google Account.
                  </li>
                  <li>
                    Click <strong>"Add project"</strong> (or select an existing Google Cloud project) and follow the quick setup.
                  </li>
                  <li>
                    In your project dashboard, click the <strong>Web icon (&lt;/&gt;)</strong> to register a Web App.
                  </li>
                  <li>
                    Firebase will display a code snippet containing <code className="text-slate-200">firebaseConfig</code> with <code className="text-cyan-300">apiKey</code>, <code className="text-cyan-300">projectId</code>, and <code className="text-cyan-300">appId</code>.
                  </li>
                  <li>
                    Copy and paste the values into the fields below, or click <strong>"Paste Entire Config Snippet"</strong> to auto-fill all 3 fields at once!
                  </li>
                </ol>
              </div>
            </div>

            {/* Quick Snippet Auto-Fill Assistant Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSnippetPaste(!showSnippetPaste)}
                  className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>{showSnippetPaste ? 'Hide Snippet Paste Box' : 'Have a Firebase snippet? Click here to auto-fill'}</span>
                </button>

                {(fbApiKey || fbProjectId) && (
                  <button
                    type="button"
                    onClick={handleResetToLocalStorage}
                    className="text-[11px] font-mono text-slate-400 hover:text-amber-400 transition-colors"
                    title="Clear cloud config and keep using local storage"
                  >
                    Clear Credentials (Use Local Only)
                  </button>
                )}
              </div>

              {showSnippetPaste && (
                <div className="mt-3 p-4 rounded-xl bg-[#18181b] border border-cyan-500/30 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Paste your Firebase configuration object or code snippet:</span>
                  </div>
                  <textarea
                    rows={4}
                    value={snippetInput}
                    onChange={(e) => setSnippetInput(e.target.value)}
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "my-project",\n  appId: "1:123456:web:abcdef"\n};`}
                    className="w-full p-3 rounded-lg bg-[#121215] border border-[#27272a] text-cyan-200 placeholder:text-slate-600 font-mono text-[11px] focus:border-cyan-400 focus:outline-none"
                  />
                  {snippetError && (
                    <p className="text-red-400 text-[11px]">{snippetError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSnippetPaste(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#121215] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleParseSnippet}
                      className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                    >
                      Auto-Extract & Fill Fields
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveFirebaseConfig} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">
                    1. API Key <span className="text-slate-500 font-normal">(apiKey)</span>
                  </label>
                  <input
                    type="text"
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    placeholder="AIzaSyA1B2C3D4E5F6G7H8..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Found in Firebase Console &gt; Project Settings &gt; General &gt; Web API Key
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">
                    2. Project ID <span className="text-slate-500 font-normal">(projectId)</span>
                  </label>
                  <input
                    type="text"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="codersera-tickets-2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Your unique project name ID (e.g. codersera-events)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  3. App ID <span className="text-slate-500 font-normal">(appId)</span>
                </label>
                <input
                  type="text"
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  placeholder="1:123456789012:web:a1b2c3d4e5f6g7h8"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Found in Project Settings under "Your apps" &gt; App ID
                </span>
              </div>

              {/* Rich Multi-Layer Test Result Display */}
              {isTestingFirebase && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                  <div>
                    <p className="font-bold text-cyan-300">Testing Firebase Connection...</p>
                    <p className="text-[11px] text-cyan-200/80 mt-0.5">
                      Probing Google Cloud Firestore REST API & checking real-time client handshake.
                    </p>
                  </div>
                </div>
              )}

              {fbTestResult && !isTestingFirebase && (
                <div className={`p-4 rounded-xl border text-xs font-mono space-y-3 ${
                  fbTestResult.status === 'connected'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : fbTestResult.status === 'connected_rules_locked'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {fbTestResult.status === 'connected' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : fbTestResult.status === 'connected_rules_locked' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-sm text-white font-display">
                        {fbTestResult.title}
                      </p>
                      <p className="text-xs leading-relaxed opacity-90">
                        {fbTestResult.message}
                      </p>

                      {/* Diagnostic details bullets */}
                      {fbTestResult.details && fbTestResult.details.length > 0 && (
                        <div className="mt-2.5 p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[11px]">
                          {fbTestResult.details.map((d, i) => (
                            <div key={i} className="text-slate-300 font-mono">
                              {d}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action recommendation */}
                      {fbTestResult.suggestedAction && (
                        <div className="pt-2 text-[11px]">
                          <strong className="text-white">Recommended Next Step: </strong>
                          <span className="opacity-90">{fbTestResult.suggestedAction}</span>
                        </div>
                      )}

                      {/* Missing Database quick button */}
                      {fbTestResult.status === 'missing_database' && (
                        <div className="pt-2 flex items-center gap-3">
                          <a
                            href={`https://console.firebase.google.com/project/${encodeURIComponent(sanitizeConfigValue(fbProjectId))}/firestore`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all"
                          >
                            <span>Open Firestore in Firebase Console</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Copyable rules snippet if rules locked */}
                      {fbTestResult.suggestedRules && (
                        <div className="pt-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-300">
                              Paste this in Firebase Console &gt; Firestore Database &gt; Rules:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyRules(fbTestResult.suggestedRules!)}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                            >
                              {rulesCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-300">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Rules</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-[11px] text-amber-200 font-mono overflow-x-auto">
                            {fbTestResult.suggestedRules}
                          </pre>
                        </div>
                      )}

                      {/* If Connected, show Cloud Sync tools */}
                      {fbTestResult.success && (
                        <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-white font-bold text-xs">
                            <Cloud className="w-4 h-4 text-cyan-400" />
                            <span>Cloud Sync & Backup Tools</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            You can now push local registrations to the cloud or sync existing tickets.
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleSyncTicketsToCloud}
                              disabled={isSyncingCloud}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-all flex items-center gap-1.5 shadow"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Upload All {tickets.length} Tickets to Cloud</span>
                            </button>

                            <button
                              type="button"
                              onClick={handlePullTicketsFromCloud}
                              disabled={isSyncingCloud}
                              className="px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-slate-200 border border-[#27272a] text-[11px] transition-all flex items-center gap-1.5"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                              <span>Pull Tickets from Cloud</span>
                            </button>
                          </div>

                          {cloudSyncMsg && (
                            <p className="text-[11px] text-cyan-300 pt-1 font-mono">{cloudSyncMsg}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={isTestingFirebase}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all flex items-center gap-2"
                >
                  {isTestingFirebase ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-slate-200 hover:text-white border border-[#27272a] transition-all text-xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT ADD / EDIT MODAL */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121215] border border-[#27272a] p-6 sm:p-8 space-y-5 shadow-2xl">
            <button
              onClick={() => setEventModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {editingEventId ? 'Edit Event Details' : 'Create New Community Event'}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  CodersEra Event Management
                </span>
              </div>
            </div>

            {eventFormError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono">
                {eventFormError}
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4 font-mono text-xs">
              {/* Event Title */}
              <div>
                <label className="block text-slate-300 mb-1">
                  Event Title <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  placeholder="e.g. Genesis 2026: 36-Hour Hackathon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-slate-300 mb-1">
                  Tagline / Short Hook
                </label>
                <input
                  type="text"
                  value={eventFormData.tagline}
                  onChange={(e) => setEventFormData({ ...eventFormData, tagline: e.target.value })}
                  placeholder="e.g. Build, Ship, and Win with modern AI & Web3 tools"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Category & Registration Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={eventFormData.category}
                    onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {EVENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Registration Status</label>
                  <select
                    value={eventFormData.isActive ? 'open' : 'closed'}
                    onChange={(e) => setEventFormData({ ...eventFormData, isActive: e.target.value === 'open' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="open">Open (Accepting Registrations)</option>
                    <option value="closed">Closed / Concluded</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">
                    Date <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                    placeholder="e.g. Saturday, Aug 22, 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Time</label>
                  <input
                    type="text"
                    value={eventFormData.time}
                    onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                    placeholder="e.g. 09:30 AM - 05:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-slate-300 mb-1">
                  Venue / Location <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.venue}
                  onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                  placeholder="e.g. Main Auditorium & Virtual Live"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Seats Quota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min={1}
                    value={eventFormData.totalSeats}
                    onChange={(e) => setEventFormData({ 
                      ...eventFormData, 
                      totalSeats: Number(e.target.value),
                      availableSeats: Math.min(Number(e.target.value), eventFormData.availableSeats)
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Available Seats Left</label>
                  <input
                    type="number"
                    min={0}
                    value={eventFormData.availableSeats}
                    onChange={(e) => setEventFormData({ ...eventFormData, availableSeats: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={eventFormData.tags}
                  onChange={(e) => setEventFormData({ ...eventFormData, tags: e.target.value })}
                  placeholder="AI, FullStack, OpenSource, Web3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 mb-1">Event Description</label>
                <textarea
                  rows={3}
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  placeholder="Provide an overview of the event, expectations, requirements, and agenda..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] bg-[#18181b] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="save-event-submit-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                >
                  {editingEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATTENDEE MODAL */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#121215] border border-[#27272a] p-6 space-y-4 font-mono text-xs shadow-2xl">
            <button
              onClick={() => setEditingTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white font-display">Edit Pass Holder Record ({editingTicket.id})</h3>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingTicket.fullName}
                  onChange={(e) => setEditingTicket({ ...editingTicket, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Roll / Student ID</label>
                  <input
                    type="text"
                    required
                    value={editingTicket.rollNumber}
                    onChange={(e) => setEditingTicket({ ...editingTicket, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editingTicket.phoneNumber}
                    onChange={(e) => setEditingTicket({ ...editingTicket, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingTicket.email}
                  onChange={(e) => setEditingTicket({ ...editingTicket, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] bg-[#18181b] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECONDARY AUTHENTICATION MODAL */}
      <SecondaryAuthModal
        isOpen={secondaryAuthOpen}
        actionTitle={
          pendingAction?.type === 'delete_event'
            ? 'Confirm Permanent Event Deletion'
            : pendingAction?.type === 'cleanup'
            ? 'Confirm Attendee Photo Purge'
            : 'Confirm Destructive Database Action'
        }
        actionDescription={
          pendingAction?.type === 'delete_event'
            ? 'This will permanently remove the event from the database. Please enter the master password (@#cde_09).'
            : pendingAction?.type === 'cleanup'
            ? 'This action replaces base64 photos with placeholder badges to conserve server storage. Requires @#cde_09.'
            : 'Please enter master administrator authorization password (@#cde_09) to confirm.'
        }
        onAuthenticated={executeAuthorizedAction}
        onClose={() => {
          setSecondaryAuthOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
};
