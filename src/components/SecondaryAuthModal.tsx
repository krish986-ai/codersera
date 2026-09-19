import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle, X, KeyRound, AlertTriangle } from 'lucide-react';

interface SecondaryAuthModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDescription: string;
  onAuthenticated: () => void;
  onClose: () => void;
}

export const SecondaryAuthModal: React.FC<SecondaryAuthModalProps> = ({
  isOpen,
  actionTitle,
  actionDescription,
  onAuthenticated,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Specific password mandated by user: @#cde_09
    if (password === '@#cde_09') {
      onAuthenticated();
      setPassword('');
      onClose();
    } else {
      setError('Invalid database manipulation authentication key. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121215] border border-[#27272a] shadow-2xl p-6 font-mono text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Database Mutation Security Shield</h3>
            <span className="text-[11px] font-mono text-amber-400">Admin Authorization Level 2</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200/90 font-mono mb-4">
          <p className="font-semibold text-white">{actionTitle}</p>
          <p className="mt-1 text-slate-300">{actionDescription}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Database Master Password</span>
              <span className="text-[10px] text-slate-500">Required: @#cde_09</span>
            </label>
            <div className="relative">
              <input
                id="secondary-auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (@#cde_09)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#27272a] bg-[#18181b] text-slate-400 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
            <button
              id="confirm-secondary-auth-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md transition-all"
            >
              Authorize & Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
