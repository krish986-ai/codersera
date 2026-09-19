import React from 'react';
import { X, Users, Image, Mail, Info, Sparkles, Github, ExternalLink, Code2, Heart } from 'lucide-react';
import { CodersEraLogo } from './CodersEraLogo';

export type InfoModalType = 'about' | 'gallery' | 'team' | 'contact' | null;

interface InfoSectionModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoSectionModal: React.FC<InfoSectionModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-[#090d16] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,180,255,0.15)] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <CodersEraLogo size="sm" showText={false} />
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                {type === 'about' && 'About CodersEra'}
                {type === 'gallery' && 'Community Gallery'}
                {type === 'team' && 'Core Leadership Team'}
                {type === 'contact' && 'Get In Touch'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                codersera.in • Home for Ambitious Student Developers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {type === 'about' && (
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
            <p className="text-base text-white font-medium">
              Everything in <strong>CodersEra</strong> is designed around real technical growth, practical building, and genuine human community.
            </p>
            <p>
              We are a premier technical developer community empowering student engineers through product hackathons, open source contributions, peer-to-peer technical mentorship, and high-impact career placement prep.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Practical Building</span>
                <span className="text-slate-400">Ship production-grade web, AI, cloud, and systems code directly to live servers.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Open Source</span>
                <span className="text-slate-400">Learn Git workflows, issue triage, pull requests, and maintainership early.</span>
              </div>
            </div>
          </div>
        )}

        {type === 'gallery' && (
          <div className="space-y-4 text-xs font-mono">
            <p className="text-slate-300 text-sm font-sans">
              Moments from CodersEra offline hackathons, code sprints, tech conclaves, and hands-on bootcamps.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="h-32 rounded-lg bg-gradient-to-tr from-cyan-950 to-slate-900 flex items-center justify-center text-cyan-400">
                  <Code2 className="w-10 h-10" />
                </div>
                <div className="font-bold text-white text-xs">HackCoders 2026 Sprint</div>
                <div className="text-slate-400 text-[11px]">36-Hour continuous building sprint with 450+ attendees.</div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="h-32 rounded-lg bg-gradient-to-tr from-blue-950 to-slate-900 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div className="font-bold text-white text-xs">Web3 & AI Summit</div>
                <div className="text-slate-400 text-[11px]">Keynote talks by industry leaders and founders.</div>
              </div>
            </div>
          </div>
        )}

        {type === 'team' && (
          <div className="space-y-4 text-xs font-mono">
            <p className="text-slate-300 text-sm font-sans">
              Meet the community leads and technical mentors driving CodersEra.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                  CE
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Community Leads</div>
                  <div className="text-slate-400 text-[11px]">CodersEra Executive Board</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold">
                  TC
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Technical Council</div>
                  <div className="text-slate-400 text-[11px]">Open Source & Architecture</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-4 text-xs font-mono">
            <p className="text-slate-300 text-sm font-sans">
              Have questions regarding event passes, partnerships, or community chapters?
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3 text-slate-200">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Email: contact@codersera.in</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <a href="https://www.codersera.in/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Official Website: www.codersera.in
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
