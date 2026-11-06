import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable KOLA TOURS AND TRAVEL Brand Logo Component
 *
 * Design Specifications:
 * - Primary Brand Colour: Deep Navy Blue (#0B1F45)
 * - Secondary Accent Colour: Orange (#F28C28)
 * - Crisp White (#FFFFFF)
 * - Globe icon with an airplane & dynamic flight-path arc alongside "KOLA"
 * - "KOLA" in refined serif ('Playfair Display', 'Cormorant Garamond', Georgia, serif)
 * - "TOURS & TRAVEL" underneath "KOLA" in clean modern sans-serif ('Roboto', sans-serif)
 */
export default function BrandLogo({
  to = '/',
  variant = 'header', // 'header' | 'footer' | 'auth' | 'compact'
  className = '',
  onClick
}) {
  const isCompact = variant === 'compact';

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Sophisticated Globe & Airplane Flight-Path SVG Emblem */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-[#0B1F45] border border-white/15 shadow-sm shrink-0 ${
          isCompact ? 'w-10 h-10' : 'w-11 h-11 sm:w-12 sm:h-12'
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-9 h-9 sm:w-10 sm:h-10"
          aria-hidden="true"
        >
          {/* Outer Globe Sphere */}
          <circle
            cx="30"
            cy="34"
            r="19.5"
            stroke="#FFFFFF"
            strokeWidth="2.3"
            strokeOpacity="0.95"
          />
          {/* Longitude Meridian Ellipse */}
          <ellipse
            cx="30"
            cy="34"
            rx="9.8"
            ry="19.5"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeOpacity="0.78"
          />
          {/* Equator & Latitude Parallels */}
          <line
            x1="10.5"
            y1="34"
            x2="49.5"
            y2="34"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeOpacity="0.78"
          />
          <path
            d="M13.5 25C19.5 27.8 40.5 27.8 46.5 25"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.65"
            strokeLinecap="round"
          />
          <path
            d="M13.5 43C19.5 40.2 40.5 40.2 46.5 43"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.65"
            strokeLinecap="round"
          />
          {/* Dynamic Orange Flight-Path Arc (#F28C28) */}
          <path
            d="M8.5 45.5C17 21 36.5 14 51.5 16"
            stroke="#F28C28"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
          {/* Precision Airplane Silhouette (#F28C28) */}
          <path
            d="M57 12.5L43.8 14.5L47.5 18.2L37.8 24.8L40.4 27.4L50.5 21.3L52.3 26.8L57 12.5Z"
            fill="#F28C28"
          />
          <circle cx="51.2" cy="16.2" r="1.4" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Typography Lockup: KOLA (Refined Serif) + TOURS & TRAVEL (Clean Sans-Serif Underneath) */}
      <div className="flex flex-col justify-center leading-none">
        <span
          style={{
            fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif"
          }}
          className={`font-bold tracking-[0.14em] text-white ${
            isCompact ? 'text-xl' : 'text-2xl sm:text-[26px]'
          }`}
        >
          KOLA
        </span>
        <span className="h-[1.5px] w-full bg-[#F28C28]/80 my-1 rounded-full" />
        <span
          style={{
            fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
          className={`font-bold uppercase tracking-[0.26em] text-[#F28C28] ${
            isCompact ? 'text-[9px]' : 'text-[9.5px] sm:text-[10.5px]'
          }`}
        >
          TOURS &amp; TRAVEL
        </span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        aria-label="KOLA TOURS AND TRAVEL — Homepage"
        className="inline-flex items-center focus:outline-none"
      >
        {content}
      </Link>
    );
  }

  return content;
}

