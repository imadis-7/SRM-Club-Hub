
"use client";

import { cn } from "@/lib/utils";

/**
 * A custom SVG component that recreates the full SRM Welkin Hub crest.
 * Includes an optional 'withText' prop to display the full logo branding.
 * Includes a 'withCredits' prop for the full attribution.
 */
interface SRMLogoProps {
  className?: string;
  withText?: boolean;
  withCredits?: boolean;
  textClassName?: string;
  creditsClassName?: string;
}

export function SRMLogo({ className, withText, withCredits, textClassName, creditsClassName }: SRMLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", (withText || withCredits) ? "w-auto" : className)}>
      {/* The Emblem */}
      <div className={cn(
        "relative flex items-center justify-center overflow-hidden shrink-0", 
        !(withText || withCredits) && className, 
        (withText || withCredits) && "w-10 h-10"
      )}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" className="opacity-20" />
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" />
          
          {/* Background Fill */}
          <circle cx="50" cy="50" r="42" fill="currentColor" />
          
          {/* Shield area */}
          <path
            d="M50 18C50 18 25 25 25 50C25 75 50 88 50 88C50 88 75 75 75 50C75 25 50 18 50 18Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          
          {/* Stylized Hub/Crest Iconography */}
          <path
            d="M50 30V75 M50 52L32 40 M50 52L68 40"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Detail circles */}
          <circle cx="50" cy="28" r="4" fill="currentColor" />
          <path d="M42 80L50 75L58 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          
          {/* Top Star */}
          <path
            d="M50 8L52 14H58L53 17L55 23L50 20L45 23L47 17L42 14H48L50 8Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Full Branding Text */}
      {(withText || withCredits) && (
        <div className="flex flex-col">
          <span className={cn(
            "text-xl font-headline font-bold tracking-tight text-foreground leading-none", 
            textClassName
          )}>
            SRM Club Hub
          </span>
          {withCredits && (
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1",
              creditsClassName
            )}>
              Made By Mohammad Imad Ud Din, Arsalan Reyaz, Haziq And Others
            </span>
          )}
        </div>
      )}
    </div>
  );
}
