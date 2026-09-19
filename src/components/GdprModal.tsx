import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle } from 'lucide-react';

interface GdprModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GdprModal: React.FC<GdprModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#060b18] border border-cyan-500/40 p-6 sm:p-8 space-y-5 text-slate-300 font-mono text-xs shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Protection & Privacy Policy</h3>
            <span className="text-[11px] text-cyan-400">CodersEra Developer Community</span>
          </div>
        </div>

        <div className="space-y-3 leading-relaxed">
          <p>
            In compliance with modern data privacy standards, CodersEra enforces strict privacy and security policies for all attendees.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>1. Purpose Limitation & Proportionality</span>
            </h4>
            <p className="text-slate-400">
              We only collect information strictly necessary to issue your digital pass, verify identity at venue check-in gates, and ensure venue safety quotas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>2. Storage Minimization & Image Retention</span>
            </h4>
            <p className="text-slate-400">
              Badge photographs are strictly capped at 1.00 MB and can be securely purged by the administrator immediately after the event concludes to conserve server storage and minimize retention.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>3. Right to Erasure & Rectification</span>
            </h4>
            <p className="text-slate-400">
              Every attendee has the right to request access to their registered record, correct details, or request permanent deletion from the database.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
