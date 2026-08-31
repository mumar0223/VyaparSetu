"use client";

import { cn } from "@/lib/utils";

export interface VyaparSetuIconProps {
  className?: string;
  size?: number | string;
}

export function VyaparSetuIcon({ className, size = 32 }: VyaparSetuIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <defs>
        <filter id="vs-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="vs-finial-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3DE086" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#3DE086" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3DE086" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dark Squircle Background */}
      <rect width="100" height="100" rx="24" fill="#0A150F" />
      <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="23.25" stroke="#163824" strokeWidth="1.5" />

      {/* Finial Glow */}
      <circle cx="50" cy="27" r="16" fill="url(#vs-finial-glow-grad)" />

      {/* Left Stay Cables */}
      <line x1="50" y1="33" x2="25" y2="70" stroke="#3DE086" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
      <line x1="50" y1="33" x2="33" y2="70" stroke="#3DE086" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
      <line x1="50" y1="33" x2="41" y2="70" stroke="#3DE086" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />

      {/* Right Stay Cables */}
      <line x1="50" y1="33" x2="75" y2="70" stroke="#3DE086" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
      <line x1="50" y1="33" x2="67" y2="70" stroke="#3DE086" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
      <line x1="50" y1="33" x2="59" y2="70" stroke="#3DE086" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />

      {/* Center Pillar */}
      <line x1="50" y1="28" x2="50" y2="70" stroke="#3DE086" strokeWidth="3.6" strokeLinecap="round" />

      {/* Orb Finial with Glow */}
      <circle cx="50" cy="27" r="5" fill="#3DE086" filter="url(#vs-glow-filter)" />

      {/* Horizontal Bridge Deck */}
      <rect x="18" y="70" width="64" height="6.5" rx="3.25" fill="#3DE086" />

      {/* Pier Supports */}
      <rect x="25" y="76.5" width="6" height="6" rx="1.5" fill="#3DE086" />
      <rect x="69" y="76.5" width="6" height="6" rx="1.5" fill="#3DE086" />
    </svg>
  );
}

export interface BrandLogoProps {
  className?: string;
  iconSize?: number | string;
  showText?: boolean;
  textClassName?: string;
  text?: string;
}

export function BrandLogo({
  className,
  iconSize = 32,
  showText = true,
  textClassName,
  text = "VyaparSetu",
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <VyaparSetuIcon size={iconSize} className="rounded-xl shadow-[0_0_12px_rgba(61,224,134,0.25)]" />
      {showText && (
        <span
          className={cn(
            "font-serif font-bold text-xl tracking-tight text-[#2EE59D] dark:text-[#3DE086]",
            textClassName
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
}
