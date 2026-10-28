import React from "react";
import { RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WaveBackground } from "@/components/WaveBackground";

interface RefreshConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RefreshConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: RefreshConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[90vw] p-5 sm:p-6 overflow-hidden bg-background">
        <WaveBackground className="absolute inset-x-0 bottom-0 pointer-events-none z-0" intensity={0.5} />
        <div className="relative z-10">
        <DialogHeader className="text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
            <RotateCcw className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Are you sure?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
            This will remove all uploaded images and reset your outfits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition-opacity cursor-pointer shadow-xs"
          >
            Yes, reset
          </button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
