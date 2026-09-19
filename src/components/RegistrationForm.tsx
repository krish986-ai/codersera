import React, { useState, useRef } from 'react';
import { 
  Upload, CheckCircle, AlertCircle, Shield, ArrowRight, User, 
  Mail, Phone, BookOpen, GraduationCap, Github, Linkedin, 
  Camera, Lock, RefreshCw, Sparkles, X, Building2
} from 'lucide-react';
import { CommunityEvent, StudentTicket, Branch, AcademicYear } from '../types';
import { 
  findExistingTicket, generateUniqueTicketId, saveTickets, getStoredTickets,
  getStoredEvents, saveEvents
} from '../lib/storage';
import {
  completeRegistrationEmailLink,
  sendRegistrationEmailLink,
} from '../lib/firebaseConfig';

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
  // Form step: 'details' -> 'verify-email' -> 'completed'
  const [step, setStep] = useState<'details' | 'verify-email'>('details');

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

  // Email-link verification state
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // GDPR consent
  const [gdprConsent, setGdprConsent] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [duplicateTicketFound, setDuplicateTicketFound] = useState<StudentTicket | null>(null);

  React.useEffect(() => {
    const pendingEmail = window.localStorage.getItem('codersera_pending_email');
    if (pendingEmail && pendingEmail === email.trim().toLowerCase() && window.location.search) {
      completeRegistrationEmailLink(pendingEmail)
        .then(async (verified) => {
          if (verified) setStep('details');
        })
        .catch(() => setVerificationError('This verification link is invalid or expired. Please request a new link.'));
    }
  }, [email]);

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

  // Step 1: Validate details and check for duplicate before proceeding to verification
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setDuplicateTicketFound(null);

    // Validation checks
    if (!fullName.trim() || !email.trim() || !rollNumber.trim() || !phoneNumber.trim()) {
      setGeneralError('Please fill in all required fields.');
      return;
    }

    if (!photoBase64) {
      setGeneralError('Please upload your photo for your student event badge.');
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

    sendRegistrationEmailLink(email.trim().toLowerCase())
      .then(() => {
        setVerificationSent(true);
        setStep('verify-email');
      })
      .catch((error: unknown) => {
        setGeneralError(error instanceof Error ? error.message : 'Unable to send the verification email.');
      });
  };

  // Step 2: Confirm email link & issue unique ticket
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');

    setIsVerifying(true);
    const pendingEmail = window.localStorage.getItem('codersera_pending_email') || email.trim().toLowerCase();
    completeRegistrationEmailLink(pendingEmail)
      .then(async (verified) => {
        if (!verified) {
          setVerificationError('Open the verification link sent to your inbox before continuing.');
          setIsVerifying(false);
          return;
        }
      // Re-verify duplicate constraint atomically
      const existing = await findExistingTicket(email, rollNumber, selectedEvent.id);
      if (existing) {
        setIsVerifying(false);
        setDuplicateTicketFound(existing);
        setVerificationError('A ticket was already generated for this user.');
          return;
      }

      // Generate Unique Ticket Number (e.g. CE-2026-4821-X9)
      const newTicketId = generateUniqueTicketId();
      const qrPayload = `${newTicketId}|${email.trim().toLowerCase()}|${rollNumber.trim().toUpperCase()}|${selectedEvent.id}`;

      const newTicket: StudentTicket = {
        id: newTicketId,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber.trim().toUpperCase(),
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

      await saveTickets([newTicket]);

      // Decrement available seat count in event
      const allEvents = await getStoredEvents();
      const eventIdx = allEvents.findIndex(ev => ev.id === selectedEvent.id);
      if (eventIdx !== -1 && allEvents[eventIdx].availableSeats > 0) {
        allEvents[eventIdx].availableSeats -= 1;
        await saveEvents([allEvents[eventIdx]]);
      }

      setIsVerifying(false);
      onTicketGenerated(newTicket);
      })
      .catch(() => {
        setIsVerifying(false);
        setVerificationError('This verification link is invalid or expired. Please request a new link.');
      });
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
            className="text-slate-400 hover:text-white text-xs font-mono transition-colors"
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
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all font-mono"
                >
                  View / Download My Pass
                </button>
                <button
                  onClick={() => setDuplicateTicketFound(null)}
                  className="text-xs text-slate-400 hover:text-white"
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

      {/* STEP 1: Details & Photo Upload */}
      {step === 'details' && (
        <form onSubmit={handleProceedToVerification} className="space-y-6">
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
                Step 1 of 2
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
                  Attendee / Student ID or Roll No. <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="reg-roll"
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. DEV-2026-088 or Roll No."
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
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all ml-auto font-mono"
            >
              <span>Verify Email & Generate Pass</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Email Verification Link */}
      {step === 'verify-email' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 sm:p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white font-display">Check Your Email</h3>
            <p className="text-xs text-slate-400 mt-2">
              We sent a secure verification link to <strong className="text-cyan-300 font-mono">{email}</strong>.
            </p>

            <div className="my-5 p-4 rounded-xl bg-[#18181b] border border-dashed border-cyan-500/40">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Verification link sent
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Open the link in your inbox, then return here to issue your badge.
              </span>
            </div>

            {verificationError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono">
                {verificationError}
              </div>
            )}

            <form onSubmit={handleConfirmVerification} className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex-1 py-2.5 rounded-xl border border-[#27272a] text-slate-400 hover:text-white text-xs font-mono"
                >
                  Back
                </button>

                <button
                  id="confirm-ticket-generation-btn"
                  type="submit"
                  disabled={isVerifying || !verificationSent}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all font-mono"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing Pass...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Issue My Event Pass</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
