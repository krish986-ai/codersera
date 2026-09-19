import React from 'react';
import { X, ExternalLink, MessageSquare, Github, Globe, CheckCircle2 } from 'lucide-react';
import { CodersEraLogo } from './CodersEraLogo';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#121215] border border-[#27272a] shadow-[0_0_50px_rgba(56,189,248,0.15)] p-6 sm:p-8 space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient cyan glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10 border-b border-[#27272a] pb-4">
          <div className="flex items-center gap-3">
            <CodersEraLogo size="sm" showText={false} />
            <div>
              <h3 className="text-lg font-bold text-white font-display">Join CodersEra</h3>
              <p className="text-xs text-slate-400 font-mono">
                Connect with ambitious student builders & developers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
          <p>
            Everything in <strong>CodersEra</strong> is designed around real technical growth, practical building, and genuine human community.
          </p>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs pt-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Open Source • Hackathons • Peer Mentorship • Placements</span>
          </div>
        </div>

        {/* Official Channels matching codersera.in */}
        <div className="space-y-3 font-mono text-xs">
          {/* WhatsApp Global Group */}
          <a
            href="https://chat.whatsapp.com/H3x7iIZ857S7ne4eLIdb06"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white">WhatsApp Global Community</div>
                <div className="text-[11px] text-slate-400">Open worldwide to student developers & creators</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </a>

          {/* WhatsApp NIET Chapter */}
          <a
            href="https://chat.whatsapp.com/IZFWh2YhwNh1Hzl5GDci2F"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-bold text-white">WhatsApp NIET Campus Chapter</div>
                <div className="text-[11px] text-slate-400">Exclusive network for NIET hackathons & meetups</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </a>

          {/* GitHub Organization */}
          <a
            href="https://github.com/CodersEraa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-white" />
              <div>
                <div className="font-bold text-white">GitHub Organization</div>
                <div className="text-[11px] text-slate-400">github.com/CodersEraa • Open source repositories</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </a>

          {/* Official Website Portal */}
          <a
            href="https://www.codersera.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-sky-400" />
              <div>
                <div className="font-bold text-white">Official CodersEra Portal</div>
                <div className="text-[11px] text-slate-400">www.codersera.in</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
};
