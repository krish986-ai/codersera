import React, { useState } from 'react';

interface CodersEraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showText?: boolean;
  subtitle?: string;
}

export const CodersEraLogo: React.FC<CodersEraLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle,
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    sm: { iconSize: 28, textClass: 'text-sm' },
    md: { iconSize: 36, textClass: 'text-base sm:text-lg' },
    lg: { iconSize: 48, textClass: 'text-xl sm:text-2xl' },
    xl: { iconSize: 64, textClass: 'text-3xl' },
    custom: { iconSize: 36, textClass: 'text-base' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Logo circular container */}
      <div 
        className="relative rounded-full overflow-hidden border border-white/15 shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center justify-center shrink-0 bg-[#09090b]"
        style={{ width: dimensions.iconSize, height: dimensions.iconSize }}
      >
        {!imgError ? (
          <img
            src="/codersera-logo-original.jpg"
            alt="CodersEra Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full p-1 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="90" stroke="#38bdf8" strokeWidth="6" fill="#09090b" />
            <path d="M 65 85 L 45 100 L 65 115" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 135 85 L 155 100 L 135 115" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="110" y1="75" x2="90" y2="125" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-white tracking-tight font-display ${dimensions.textClass}`}>
              CodersEra
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
