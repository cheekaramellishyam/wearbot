import { useState, useEffect } from "react";
import { Check, Copy, ExternalLink, Key, Loader2, LogOut, ShieldCheck } from "lucide-react";
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
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShared, setCopiedShared] = useState(false);

  const devCallback = "https://ais-dev-ehjtpiuor7f4ybt7sthnbb-782280690151.asia-southeast1.run.app/auth/pinterest/callback";
  const sharedCallback = "https://ais-pre-ehjtpiuor7f4ybt7sthnbb-782280690151.asia-southeast1.run.app/auth/pinterest/callback";

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/auth/pinterest/status");
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
        setUser(data.user || null);
        setOauthConfigured(data.oauthConfigured);
        if (data.redirectUri) setRedirectUri(data.redirectUri);
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
            "Pinterest OAuth credentials (PINTEREST_APP_ID) are not configured in Secrets."
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

  const copyToClipboard = (text: string, isDev: boolean) => {
    navigator.clipboard.writeText(text);
    if (isDev) {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2000);
    } else {
      setCopiedShared(true);
      setTimeout(() => setCopiedShared(false), 2000);
    }
    toast.success("Callback URL copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pinterest/10 text-pinterest">
              <PinterestLogo className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Pinterest Integration</DialogTitle>
              <DialogDescription className="text-xs">
                Connect official Pinterest access for live outfit inspiration.
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
            <div className="flex items-center gap-3 rounded-lg border border-line bg-muted/30 p-3">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pinterest text-white">
                  <PinterestLogo className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{user?.username}</p>
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Connected to Pinterest API v5</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Your Pinterest account is connected. Visually similar outfit searches will
              prioritize live inspiration directly from your boards and Pinterest API.
            </p>

            <button
              type="button"
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 rounded-md border border-line px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect Pinterest Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-1">
            <div className="rounded-md border border-line bg-accent/20 p-3 text-xs leading-relaxed text-muted-foreground">
              WEARBOT already displays real Pinterest outfits out-of-the-box. Connecting official
              Pinterest access grants personalized access to your pins and boards.
            </div>

            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-pinterest px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PinterestLogo className="h-4 w-4" />
              )}
              {loading ? "Opening Pinterest…" : "Connect with Pinterest"}
            </button>

            {/* Developer Setup Instructions */}
            <div className="border-t border-line/60 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Key className="h-3.5 w-3.5" />
                <span>Pinterest Developer Setup</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                To enable 1-click OAuth login, create an app at{" "}
                <a
                  href="https://developers.pinterest.com/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-pinterest inline-flex items-center gap-0.5"
                >
                  developers.pinterest.com <ExternalLink className="h-2.5 w-2.5" />
                </a>{" "}
                and add these redirect URIs:
              </p>

              <div className="mt-2 space-y-1.5">
                <div className="rounded border border-line bg-muted/40 p-1.5 text-[10px]">
                  <div className="flex items-center justify-between font-mono text-muted-foreground">
                    <span className="truncate pr-2">{devCallback}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(devCallback, true)}
                      className="p-1 hover:text-foreground"
                    >
                      {copiedDev ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="rounded border border-line bg-muted/40 p-1.5 text-[10px]">
                  <div className="flex items-center justify-between font-mono text-muted-foreground">
                    <span className="truncate pr-2">{sharedCallback}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sharedCallback, false)}
                      className="p-1 hover:text-foreground"
                    >
                      {copiedShared ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-muted-foreground">
                Then set <code className="bg-muted px-1 rounded">PINTEREST_APP_ID</code> and{" "}
                <code className="bg-muted px-1 rounded">PINTEREST_APP_SECRET</code> (or{" "}
                <code className="bg-muted px-1 rounded">PINTEREST_ACCESS_TOKEN</code>) in Secrets.
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-line px-4 py-2 text-xs font-medium hover:bg-accent transition-colors"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
