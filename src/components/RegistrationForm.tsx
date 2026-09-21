import React, { useState, useRef } from 'react';
import { 
  Upload, CheckCircle, AlertCircle, Shield, ArrowRight, User, 
  Mail, Phone, BookOpen, GraduationCap, Github, Linkedin, 
  Camera, Lock, RefreshCw, Sparkles, X, Building2
} from 'lucide-react';
import { CommunityEvent, StudentTicket, Branch, AcademicYear } from '../types';
import { 
  findExistingTicket, generateUniqueTicketId, saveTickets
} from '../lib/storage';

interface RegistrationFormProps {
  selectedEvent: CommunityEvent;
  onTicketGenerated: (ticket: StudentTicket) => void;
  onViewExistingTicket: (ticket: StudentTicket) => void;
  onCancel: () => void;
}

const BRANCHES: Branch[] = [
  'Full Stack & Web Development',
  'Artificial Intelligence & Machine Learning',
  'Cloud Computing & DevOps',
  'Cybersecurity & Systems',
  'Blockchain & Web3 Engineering',
  'Mobile & App Engineering',
  'UI/UX & Product Design',
  'Computer Science & Engineering',
  'Open Source & General Engineering',
];

const YEARS: AcademicYear[] = [
  'Student Developer (1st / 2nd Year)',
  'Senior Student (3rd / 4th Year)',
  'Postgraduate / Researcher',
  'Working Professional / Builder',
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  selectedEvent,
  onTicketGenerated,
  onViewExistingTicket,
  onCancel,
}) => {
  const registrationDraftKey = `codersera_registration_draft_${selectedEvent.id}`;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [branch, setBranch] = useState<Branch>('Full Stack & Web Development');
  const [year, setYear] = useState<AcademicYear>('Student Developer (1st / 2nd Year)');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  
  // Photo upload & 1.00 MB restriction
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoSizeKb, setPhotoSizeKb] = useState<number>(0);
  const [photoError, setPhotoError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GDPR consent
  const [gdprConsent, setGdprConsent] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [duplicateTicketFound, setDuplicateTicketFound] = useState<StudentTicket | null>(null);

  const issueTicket = async () => {
    setGeneralError('');
    try {
      const existing = await findExistingTicket(email, rollNumber, selectedEvent.id);
      if (existing) {
        setDuplicateTicketFound(existing);
        throw new Error('A ticket was already generated for this user.');
      }

      const newTicketId = generateUniqueTicketId();
      const cleanEmail = email.trim().toLowerCase();
      const cleanRoll = rollNumber.trim().toUpperCase();
      const qrPayload = `${newTicketId}|${cleanEmail}|${cleanRoll}|${selectedEvent.id}`;
      const newTicket: StudentTicket = {
        id: newTicketId,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        fullName: fullName.trim(),
        email: cleanEmail,
        rollNumber: cleanRoll,
        collegeName: collegeName.trim() || undefined,
        branch,
        year,
        phoneNumber: phoneNumber.trim(),
        githubUrl: githubUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        photoBase64,
        isVerified: true,
        checkedIn: false,
        createdAt: new Date().toISOString(),
        qrPayload,
        gdprConsent: true,
      };
      const createdTicket = await saveTickets([newTicket]);
      window.sessionStorage.removeItem(registrationDraftKey);
      window.localStorage.removeItem(registrationDraftKey);
      window.sessionStorage.removeItem('codersera_pending_email');
      window.localStorage.removeItem('codersera_pending_email');
      window.sessionStorage.removeItem('codersera_email_verified');
      window.localStorage.removeItem('codersera_email_verified');
      onTicketGenerated(createdTicket || newTicket);
    } catch (err: any) {
      if (err?.message?.includes('already exists') || err?.message?.includes('already generated')) {
        const existing = await findExistingTicket(email, rollNumber, selectedEvent.id);
        if (existing) setDuplicateTicketFound(existing);
      }
      throw err;
    }
  };

  React.useEffect(() => {
    const savedDraft = window.sessionStorage.getItem(registrationDraftKey)
      || window.localStorage.getItem(registrationDraftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as Partial<{
          fullName: string;
          email: string;
          rollNumber: string;
          collegeName: string;
          branch: Branch;
          year: AcademicYear;
          phoneNumber: string;
          githubUrl: string;
          linkedinUrl: string;
          photoBase64: string;
          photoSizeKb: number;
          gdprConsent: boolean;
        }>;
        setFullName(draft.fullName || '');
        setEmail(draft.email || '');
        setRollNumber(draft.rollNumber || '');
        setCollegeName(draft.collegeName || '');
        if (draft.branch) setBranch(draft.branch);
        if (draft.year) setYear(draft.year);
        setPhoneNumber(draft.phoneNumber || '');
        setGithubUrl(draft.githubUrl || '');
        setLinkedinUrl(draft.linkedinUrl || '');
        setPhotoBase64(draft.photoBase64 || '');
        setPhotoSizeKb(draft.photoSizeKb || 0);
        setGdprConsent(Boolean(draft.gdprConsent));
      } catch {
        window.sessionStorage.removeItem(registrationDraftKey);
        window.localStorage.removeItem(registrationDraftKey);
      }
    }
  }, [registrationDraftKey]);

  // Handle Photo Upload with strictly <= 1.00 MB validation
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // 1.00 MB = 1048576 bytes
    const MAX_BYTES = 1024 * 1024;
    const sizeInMb = file.size / (1024 * 1024);
    const sizeInKb = Math.round(file.size / 1024);

    if (file.size > MAX_BYTES) {
      setPhotoError(`Selected image is ${sizeInMb.toFixed(2)} MB, which exceeds the strictly allowed 1.00 MB limit. Please select an optimized photo.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPhotoSizeKb(sizeInKb);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoBase64('');
    setPhotoSizeKb(0);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Validate details and issue pass directly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setPhotoError('');
    setDuplicateTicketFound(null);

    // Validation checks
    if (!fullName.trim() || !email.trim() || !rollNumber.trim() || !phoneNumber.trim()) {
      setGeneralError('Please fill in all required fields.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setGeneralError('Please enter a valid email address.');
      return;
    }

    if (!photoBase64) {
      setPhotoError('Please upload your photo for your verified event pass.');
      return;
    }

    if (!gdprConsent) {
      setGeneralError('You must agree to the data processing terms to generate your pass.');
      return;
    }

    // Single Allocation Check: One ticket per user rule
    const existing = await findExistingTicket(email, rollNumber, selectedEvent.id);
    if (existing) {
      setDuplicateTicketFound(existing);
      setGeneralError(`A ticket has already been issued for ${email} / ID: ${rollNumber} for this event. Multiple tickets per attendee are not allowed.`);
      return;
    }

    const draft = {
      fullName, email: email.trim().toLowerCase(), rollNumber: rollNumber.trim().toUpperCase(),
      collegeName, branch, year, phoneNumber, githubUrl, linkedinUrl, photoBase64, photoSizeKb, gdprConsent,
    };
    window.sessionStorage.setItem(registrationDraftKey, JSON.stringify(draft));
    window.localStorage.setItem(registrationDraftKey, JSON.stringify(draft));

    setIsSubmitting(true);
    try {
      await issueTicket();
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Unable to issue pass.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Event Header Banner */}
      <div className="mb-6 p-5 rounded-2xl bg-[#121215] border border-[#27272a]">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            {selectedEvent.category} • PASS REGISTRATION
          </span>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            ← Change Event
          </button>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">{selectedEvent.title}</h2>
        <p className="text-xs text-slate-300 mt-1">{selectedEvent.tagline}</p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
          <span>📅 {selectedEvent.date}</span>
          <span>📍 {selectedEvent.venue}</span>
        </div>
      </div>

      {/* Duplicate Ticket Alert Modal if user already enrolled */}
      {duplicateTicketFound && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white font-display">Pass Already Issued</h4>
              <p className="text-xs mt-1 text-amber-200/90 leading-relaxed">
                A verified pass (<strong className="text-amber-300 font-mono">{duplicateTicketFound.id}</strong>) is already registered to this email/ID for this event.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  id="view-duplicate-ticket-btn"
                  onClick={() => onViewExistingTicket(duplicateTicketFound)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all font-mono cursor-pointer"
                >
                  View / Download My Pass
                </button>
                <button
                  onClick={() => setDuplicateTicketFound(null)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {generalError && !duplicateTicketFound && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="border-b border-[#27272a] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Pass Holder Information</span>
              </h3>
              <span className="text-xs text-slate-400">Official digital pass issuance</span>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
              Verified Issuance
            </span>
          </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                id="reg-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aditya Raj Srivastava"
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-sm focus:border-cyan-400 focus:outline-none transition-all"
              />
            </div>

            {/* Email & Roll/Student ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-sm focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Registration / Attendee ID (or Student Roll No.) <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="reg-roll"
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. CE-DEV-2026 or College Roll No."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-sm focus:border-cyan-400 focus:outline-none transition-all uppercase font-mono"
                />
              </div>
            </div>

            {/* College / Organization */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Institution / University / Organization (Optional)</span>
              </label>
              <input
                id="reg-college"
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. NIET Greater Noida / Independent Builder"
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Track & Experience Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Developer Track / Focus Area <span className="text-cyan-400">*</span>
                </label>
                <select
                  id="reg-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as Branch)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b} className="bg-[#18181b] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Experience Level / Stage <span className="text-cyan-400">*</span>
                </label>
                <select
                  id="reg-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value as AcademicYear)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-[#18181b] text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                WhatsApp / Mobile Number <span className="text-cyan-400">*</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>

            {/* Developer Profiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-medium">
                  <Github className="w-3.5 h-3.5 text-slate-400" />
                  <span>GitHub Profile (Optional)</span>
                </label>
                <input
                  id="reg-github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-medium">
                  <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                  <span>LinkedIn Profile (Optional)</span>
                </label>
                <input
                  id="reg-linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Photo Upload Section with strictly <= 1.00 MB limit */}
            <div className="pt-2 border-t border-[#27272a]">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Badge Photo <span className="text-cyan-400">*</span></span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  Strictly Max: 1.00 MB
                </span>
              </label>

              {photoError && (
                <div className="mb-3 p-3 rounded-lg bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {!photoBase64 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#27272a] hover:border-cyan-500/70 rounded-2xl p-6 text-center cursor-pointer bg-[#18181b]/50 hover:bg-[#18181b] transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    id="reg-photo-file"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 transition-transform mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">Click or drag & drop badge photo</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    JPG, PNG or WEBP (Max 1.00 MB strictly enforced)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#18181b] border border-cyan-500/40">
                  <img
                    src={photoBase64}
                    alt="Badge Preview"
                    className="w-16 h-20 rounded-lg object-cover border border-cyan-400"
                  />
                  <div className="flex-1 text-xs">
                    <span className="text-cyan-400 font-bold flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Photo Verified</span>
                    </span>
                    <p className="text-slate-300 mt-1 font-mono text-[11px]">Size: {photoSizeKb} KB (Within 1.00 MB limit)</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Photo will be imprinted onto your interactive 3D event badge.</p>
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="p-1.5 rounded-lg bg-[#27272a] text-slate-400 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                    title="Change Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* GDPR Data Consent */}
            <div className="pt-2 border-t border-[#27272a]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="reg-gdpr-consent"
                  type="checkbox"
                  required
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[#27272a] bg-[#18181b] text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  I consent to CodersEra issuing my digital access pass, generating cryptographic gate credentials, and verifying check-in at the event entrance.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-[#27272a] text-slate-400 hover:text-white text-xs font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              id="proceed-verify-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all ml-auto font-mono cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Issuing Pass...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Verified Event Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );
};
