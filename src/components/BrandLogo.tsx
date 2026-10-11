/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface BrandLogoProps {
  /**
   * 'icon': standalone emblem only
   * 'full': emblem + wordmark (and optional tagline)
   * 'wordmark': typography wordmark only
   */
  variant?: 'icon' | 'full' | 'wordmark';
  /**
   * 'light': dark text/borders for light backgrounds (default)
   * 'dark': light text/accents for dark backgrounds
   */
  theme?: 'light' | 'dark';
  /**
   * Sizing scale
   */
  size?: 'compact' | 'default' | 'large' | 'xl';
  /**
   * Display the official brand tagline "PLAN · TRACK · GROW"
   */
  showTagline?: boolean;
  /**
   * Optional click handler (e.g., jump back to dashboard overview)
   */
  onClick?: () => void;
  className?: string;
}

/**
 * Pocketwise Brand Emblem
 * An original geometric pocket silhouette embedded with 3 rising financial bars
 * and an intelligent upward money trajectory / growth leaf curve.
 */
export const BrandEmblem: React.FC<{
  sizePx: number;
  className?: string;
}> = ({ sizePx, className = '' }) => {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Pocketwise Emblem"
    >
      <defs>
        <linearGradient id="pwPocketBg" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F3826" />
          <stop offset="55%" stopColor="#13432E" />
          <stop offset="100%" stopColor="#082217" />
        </linearGradient>
        <linearGradient id="pwLimeFlow" x1="16" y1="44" x2="48" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#72B340" />
          <stop offset="55%" stopColor="#D4F478" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
        <linearGradient id="pwBar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#84C958" />
          <stop offset="100%" stopColor="#3B7D4E" />
        </linearGradient>
        <linearGradient id="pwBar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B2EB5C" />
          <stop offset="100%" stopColor="#4E995F" />
        </linearGradient>
        <linearGradient id="pwBar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4F478" />
          <stop offset="100%" stopColor="#72B340" />
        </linearGradient>
        <filter id="pwGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#D4F478" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Pocket Outer Contour */}
      <path
        d="M 12 10 C 12 7.79 13.79 6 16 6 H 48 C 50.21 6 52 7.79 52 10 V 36 C 52 46.5 42.5 56 32 58 C 21.5 56 12 46.5 12 36 Z"
        fill="url(#pwPocketBg)"
        stroke="#2E7554"
        strokeWidth="1.5"
      />

      {/* Pocket Stitch Detail (Tailored pocket signature) */}
      <path
        d="M 16 13.5 H 48"
        stroke="#255D42"
        strokeWidth="1.2"
        strokeDasharray="2.5 2"
      />

      {/* 3 Rising Financial Bars (Plan -> Track -> Grow) */}
      <rect x="20" y="34" width="5.5" height="13" rx="2.75" fill="url(#pwBar1)" />
      <rect x="29.25" y="27" width="5.5" height="20" rx="2.75" fill="url(#pwBar2)" />
      <rect x="38.5" y="19" width="5.5" height="28" rx="2.75" fill="url(#pwBar3)" />

      {/* Flowing intelligent money trajectory / growth leaf curve */}
      <path
        d="M 16 43 C 24 43 28 32 46 17"
        stroke="url(#pwLimeFlow)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#pwGlow)"
      />

      {/* Apex Wealth Star Node */}
      <circle cx="46.5" cy="16.5" r="3" fill="#FFF275" />
      <circle cx="46.5" cy="16.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'default',
  showTagline = false,
  onClick,
  className = '',
}) => {
  // Sizing definitions
  const sizeMap = {
    compact: {
      emblem: 28,
      textSize: 'text-base',
      taglineSize: 'text-[8px]',
      gap: 'gap-2',
    },
    default: {
      emblem: 34,
      textSize: 'text-lg',
      taglineSize: 'text-[9px]',
      gap: 'gap-2.5',
    },
    large: {
      emblem: 44,
      textSize: 'text-2xl',
      taglineSize: 'text-[10px]',
      gap: 'gap-3',
    },
    xl: {
      emblem: 56,
      textSize: 'text-3xl',
      taglineSize: 'text-[11px]',
      gap: 'gap-3.5',
    },
  };

  const currentSize = sizeMap[size];

  const textColor =
    theme === 'dark' ? 'text-white' : 'text-[#133226]';
  const wiseColor =
    theme === 'dark' ? 'text-[#D4F478]' : 'text-[#133226]';
  const taglineColor =
    theme === 'dark' ? 'text-[#A3B899]' : 'text-[#5E7166]';

  const content = (
    <div
      className={`inline-flex items-center ${currentSize.gap} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {variant !== 'wordmark' && (
        <div className="shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-xs">
          <BrandEmblem sizePx={currentSize.emblem} />
        </div>
      )}

      {variant !== 'icon' && (
        <div className="flex flex-col leading-tight select-none">
          <div className="flex items-baseline">
            <span
              className={`font-extrabold tracking-tight ${currentSize.textSize} ${textColor}`}
            >
              Pocket<span className={wiseColor}>wise</span>
            </span>
          </div>
          {showTagline && (
            <span
              className={`font-bold tracking-[0.2em] uppercase mt-0.5 ${currentSize.taglineSize} ${taglineColor}`}
            >
              PLAN · TRACK · GROW
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex items-center text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#133226] rounded-xl transition-opacity hover:opacity-95"
        title="Go to Pocketwise Dashboard Overview"
        aria-label="Pocketwise Home"
      >
        {content}
      </button>
    );
  }

  return content;
};
