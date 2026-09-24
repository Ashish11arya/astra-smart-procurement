import React from 'react';

interface AstraLogoProps {
  className?: string;
  size?: number;
}

export function AstraLogo({ className = 'w-9 h-9', size }: AstraLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={style}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <rect width="36" height="36" rx="9" fill="#00875A" />
        {/* Central top grain */}
        <path d="M18 5.8 C16.5 7.8 16.5 9.8 18 11 C19.5 9.8 19.5 7.8 18 5.8Z" fill="white" />
        {/* Tier 1 grains */}
        <path d="M17 9.4 C14.2 9.6 13 11.8 14.2 13.4 C15.6 13.2 16.8 11.8 17.5 10.2Z" fill="white" />
        <path d="M19 9.4 C21.8 9.6 23 11.8 21.8 13.4 C20.4 13.2 19.2 11.8 18.5 10.2Z" fill="white" />
        {/* Tier 2 grains */}
        <path d="M17 13 C13.5 13.4 12 16 13.5 17.8 C15 17.6 16.5 15.8 17.5 13.8Z" fill="white" />
        <path d="M19 13 C22.5 13.4 24 16 22.5 17.8 C21 17.6 19.5 15.8 18.5 13.8Z" fill="white" />
        {/* Tier 3 grains */}
        <path d="M17 17.2 C13.6 17.6 12.2 20.2 13.8 22 C15.2 21.8 16.6 19.8 17.5 17.8Z" fill="white" />
        <path d="M19 17.2 C22.4 17.6 23.8 20.2 22.2 22 C20.8 21.8 19.4 19.8 18.5 17.8Z" fill="white" />
        {/* Tier 4 base grains */}
        <path d="M17.2 21.4 C14.6 21.8 13.6 23.8 15.2 25.2 C16.4 24.8 17.2 23.4 17.7 22Z" fill="white" />
        <path d="M18.8 21.4 C21.4 21.8 22.4 23.8 20.8 25.2 C19.6 24.8 18.8 23.4 18.3 22Z" fill="white" />
        {/* Stem */}
        <path d="M17.2 24.5 L18 29.5 L18.8 24.5 Z" fill="white" />
      </svg>
    </div>
  );
}
