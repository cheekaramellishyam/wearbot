import { useState } from "react";
import { Check, Loader2, LogOut, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WaveBackground } from "@/components/WaveBackground";
import {
  GoogleUserProfile,
  signInWithGoogle,
  signOutGoogle,
} from "@/lib/google-auth";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: GoogleUserProfile | null;
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
}: ProfileDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      toast.success(
        `Welcome, ${profile.displayName || "Google User"}! Signed in as ${profile.initials}`,
        { duration: 2000 }
      );
      onOpenChange(false);
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        console.error("Sign-in error:", err);
        const isConfigErr =
          err?.code === "auth/unauthorized-domain" || err?.code === "auth/operation-not-allowed";
        toast.error(err?.message || "Google sign-in could not be completed.", {
          duration: isConfigErr ? 8000 : 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutGoogle();
      toast.success("Signed out of Google account", { duration: 1500 });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] p-6 overflow-hidden bg-background">
        {/* Abstract wave ribbon background matching reference inner box */}
        <WaveBackground className="absolute inset-x-0 bottom-0 pointer-events-none z-0" intensity={0.7} />

        <div className="relative z-10">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
                {user ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-white text-sm font-bold shadow-2xs">
                    {user.initials}
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {user ? "Google Account" : "Sign in to WearBot"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {user
                    ? "Connected with your Google profile"
                    : "Sign in with Google to sync your wardrobe and save outfits across sessions."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

        {user ? (
          /* Signed In State */
          <div className="mt-4 flex flex-col items-center gap-4 py-2">
            {/* Google Avatar / Initials Circle */}
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="h-20 w-20 rounded-full object-cover border-2 border-line shadow-xs"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a73e8] text-white text-2xl font-bold tracking-wider shadow-md">
                  {user.initials}
                </div>
              )}

              {/* Verified Google Badge */}
              <div
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-line shadow-2xs"
                title="Google Account Verified"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
            </div>

            {/* User Name & Details */}
            <div className="text-center">
              <h3 className="text-base font-bold text-foreground">
                {user.displayName || "Google User"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                <span>Signed in as {user.initials}</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="w-full pt-3 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 px-4 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>Sign out of Google</span>
              </button>
            </div>
          </div>
        ) : (
          /* Signed Out State */
          <div className="mt-4 flex flex-col items-center gap-3 py-1">
            {/* Benefits summary list */}
            <div className="w-full rounded-lg border border-line/60 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Auto-save your uploaded tops, bottoms & soles</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Personalized AI outfit recommendations & history</span>
              </div>
            </div>

            {/* Official Google Material Sign-In Button */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-line bg-card py-3 px-4 text-xs font-semibold text-foreground hover:bg-accent/60 transition-all shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span>{loading ? "Connecting to Google…" : "Sign in with Google"}</span>
            </button>

            {/* Skip / Continue as guest button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 py-1 transition-colors cursor-pointer"
            >
              Continue without signing in
            </button>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
