import React from "react";
import { Sparkles, Shuffle, X, AlertCircle, Zap } from "lucide-react";
import { AiLimitState } from "@/lib/ai-limits";
import { WaveBackground } from "@/components/WaveBackground";

interface GenerationModeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectMode: (mode: "basic" | "ai") => void;
  limits: AiLimitState;
  hasSoles: boolean;
  topsCount: number;
  bottomsCount: number;
  buttonColor?: string;
}

export const GenerationModeDialog: React.FC<GenerationModeDialogProps> = ({
  open,
  onClose,
  onSelectMode,
  limits,
  buttonColor,
}) => {
  if (!open) return null;

  const isAiLimitReached = limits.used >= limits.total;
  const remaining = Math.max(0, limits.total - limits.used);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-line bg-background p-5 sm:p-6 shadow-xl text-foreground animate-in zoom-in-95 duration-150 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Abstract wave ribbon background matching reference inner box */}
        <WaveBackground className="absolute inset-x-0 bottom-0 pointer-events-none z-0" intensity={0.65} />

        <div className="relative z-10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary mb-1.5">
            <Zap className="h-3 w-3 text-primary" />
            <span>Ready to Style</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Choose styling mode
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Select how you'd like to generate your outfit recommendations:
          </p>
        </div>

        {/* Two Options */}
        <div className="space-y-3">
          {/* Option 1: Quick Shuffle (Basic / Random) */}
          <div className="rounded-xl border border-line bg-muted/20 p-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Shuffle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Quick Shuffle
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Fast visual wardrobe pairings
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Unlimited
              </span>
            </div>

            {/* Black button with white text for basic generation */}
            <button
              type="button"
              onClick={() => onSelectMode("basic")}
              className="mt-3.5 w-full flex items-center justify-center gap-2 rounded-lg bg-black text-white hover:bg-neutral-800 py-2.5 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Quick Shuffle</span>
            </button>
          </div>

          {/* Option 2: AI Stylist */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              isAiLimitReached
                ? "border-line bg-muted/20 opacity-90"
                : "border-pinterest/30 bg-pinterest/5 hover:border-pinterest/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pinterest text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    AI Stylist
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Color harmony, scores & advice
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isAiLimitReached
                    ? "bg-destructive/10 text-destructive"
                    : "bg-pinterest/20 text-pinterest"
                }`}
              >
                {limits.used} / {limits.total} used today
              </span>
            </div>

            {/* Quota indicator */}
            <div className="mt-3 rounded-lg border border-line/60 bg-background/60 p-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground">Daily Limit</span>
                <span className="font-semibold text-foreground">
                  {remaining} left today
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAiLimitReached ? "bg-destructive" : "bg-pinterest"
                  }`}
                  style={{ width: `${Math.min(100, (limits.used / limits.total) * 100)}%` }}
                />
              </div>
            </div>

            {isAiLimitReached ? (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Daily limit reached ({limits.total}/{limits.total}). Use Quick Shuffle!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectMode("ai")}
                className="mt-3.5 w-full flex items-center justify-center gap-2 rounded-lg bg-[#D3454A] py-2.5 text-xs font-semibold text-white hover:bg-[#BD363B] active:bg-[#A6292E] transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate with AI</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-line/60 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
