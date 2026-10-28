import { useState, useEffect } from "react";
import { Loader2, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PinterestLogo } from "@/components/PinterestLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PinterestUser {
  username: string;
  profile_image?: string;
  account_type?: string;
}

interface PinterestConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectedChange?: (connected: boolean) => void;
}

export function PinterestConnectDialog({
  open,
  onOpenChange,
  onConnectedChange,
}: PinterestConnectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<PinterestUser | null>(null);

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/auth/pinterest/status");
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
        setUser(data.user || null);
        onConnectedChange?.(data.connected);
      }
    } catch (e) {
      console.warn("Could not check Pinterest status:", e);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      checkStatus();
    }
  }, [open]);

  // Listen for OAuth postMessage callback from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "PINTEREST_AUTH_SUCCESS") {
        toast.success("Successfully connected to your Pinterest account!");
        checkStatus();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pinterest/url");
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(
          data.error ||
            "Pinterest OAuth credentials are not configured in Secrets."
        );
      }

      // Open OAuth provider's authorization URL directly in popup
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        data.url,
        "pinterest_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,status=no`
      );

      if (!authWindow) {
        toast.error("Please allow popups for this site to connect your Pinterest account.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start Pinterest authorization.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/auth/pinterest/disconnect", { method: "POST" });
      setConnected(false);
      setUser(null);
      onConnectedChange?.(false);
      toast.success("Disconnected from Pinterest.");
    } catch {
      toast.error("Failed to disconnect from Pinterest.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] p-5 sm:p-6 bg-background rounded-xl border border-line shadow-xl">
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pinterest/10 text-pinterest">
                <PinterestLogo className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Pinterest Integration</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Connect personal Pinterest boards or enjoy built-in visual outfit matching.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {statusLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-pinterest" />
            </div>
          ) : connected ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-muted/40 p-3.5">
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.username}
                    className="h-12 w-12 rounded-full object-cover border border-line shadow-xs"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pinterest text-white shadow-xs">
                    <PinterestLogo className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{user?.username}</p>
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">Connected to Pinterest API v5</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Your Pinterest account is connected. Visually similar outfit searches will prioritize
                live inspiration directly from your boards and pins.
              </p>

              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center justify-center gap-2 rounded-md border border-line py-2 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect Pinterest Account
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-1">
              {/* Informative banner clarifying that Pinterest is 100% optional */}
              <div className="rounded-lg border border-line/70 bg-accent/30 p-3.5 text-xs leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-pinterest shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Built-in Fashion Search Active: </span>
                    <span className="text-muted-foreground">
                      WEARBOT already retrieves similar outfit inspiration out-of-the-box. Linking official Pinterest is completely optional and only needed to sync your personal boards.
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-pinterest py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PinterestLogo className="h-4 w-4" />
                )}
                <span>{loading ? "Opening Pinterest…" : "Connect with Pinterest"}</span>
              </button>
            </div>
          )}

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto rounded-lg border border-line py-2 px-5 text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
            >
              Close
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
