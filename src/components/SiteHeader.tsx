import { RotateCcw, User } from "lucide-react";
import { WardrobeHangerLogo } from "@/components/WardrobeHangerLogo";
import { GoogleUserProfile } from "@/lib/google-auth";

interface SiteHeaderProps {
  onOpenWardrobe?: () => void;
  onRefresh?: () => void;
  wardrobeCount?: number;
  googleUser?: GoogleUserProfile | null;
  onOpenProfile?: () => void;
}

export function SiteHeader({
  onOpenWardrobe,
  onRefresh,
  wardrobeCount = 0,
  googleUser,
  onOpenProfile,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-4 md:h-20 md:px-8">
        {/* Wardrobe & Refresh controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onOpenWardrobe}
            aria-label="Open Wardrobe"
            className="group relative flex items-center justify-center p-1 sm:p-1.5 rounded-md text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
            title="Open Wardrobe"
          >
            <WardrobeHangerLogo className="h-5 sm:h-6 md:h-7 w-auto" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs">
              {wardrobeCount}
            </span>
          </button>

          {/* Refresh button (h-6 w-6) */}
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh"
            className="group ml-3 sm:ml-4 flex items-center justify-center p-1.5 sm:p-2 rounded-md text-foreground hover:bg-accent/50 transition-all cursor-pointer"
            title="Refresh"
          >
            <RotateCcw
              className="h-6 w-6 text-foreground/85 group-hover:text-foreground transition-transform duration-300 group-active:-rotate-90"
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* Brand Home Link */}
        <a
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
          aria-label="WEARBOT home"
        >
          <svg
            viewBox="0 0 175.45 28"
            className="h-4 w-auto text-foreground min-[400px]:h-5 md:h-7"
            aria-hidden="true"
            focusable="false"
          >
            <text x="0" y="27" textLength="175.45" lengthAdjust="spacingAndGlyphs" className="wearbot-wordmark">
              WEARBOT
            </text>
          </svg>
        </a>

        {/* Right header controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* Profile Button with Google Account initials / avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={
              googleUser
                ? `Google Account: ${googleUser.displayName || googleUser.initials}`
                : "Sign in with Google"
            }
            className="relative flex items-center justify-center transition-all cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={
              googleUser
                ? `Signed in as ${googleUser.displayName || googleUser.email}`
                : "Sign in with Google"
            }
          >
            {googleUser ? (
              googleUser.photoURL ? (
                <div className="relative">
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || "Profile"}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-line shadow-2xs hover:opacity-90"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                      if (fallback) (fallback as HTMLElement).style.display = "flex";
                    }}
                  />
                  <div className="avatar-fallback hidden h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#1a73e8] text-white text-xs sm:text-sm font-bold shadow-2xs tracking-wider">
                    {googleUser.initials}
                  </div>
                </div>
              ) : (
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#1a73e8] text-white text-xs sm:text-sm font-bold shadow-2xs tracking-wider hover:opacity-90">
                  {googleUser.initials}
                </div>
              )
            ) : (
              <div className="p-1.5 sm:p-2 text-foreground hover:opacity-70 transition-opacity">
                <User className="h-6 w-6" strokeWidth={1.5} />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
