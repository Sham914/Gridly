"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setOpen(false);
      setDragOver(false);
      toast.success("Energy data uploaded successfully.", {
        description: "Analysis is being prepared.",
      });
    },
    [],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-2 rounded border border-base-border bg-white/5 px-3 py-2 text-sm text-ink-primary hover:border-accent-gold/35 hover:bg-white/[0.07] transition-colors"
      >
        <UploadCloud className="h-4 w-4 text-accent-gold" />
        <span className="hidden sm:inline">Upload CSV</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Upload energy data"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-base-border bg-base-surface p-5 shadow-glow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-ink-primary">Upload energy data</h2>
                <button
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="focus-ring rounded p-1 text-ink-muted hover:text-ink-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
                  dragOver
                    ? "border-accent-gold bg-accent-gold/5"
                    : "border-white/15 hover:border-white/25",
                )}
              >
                <FileSpreadsheet className="h-8 w-8 text-accent-gold" />
                <div>
                  <p className="text-sm text-ink-primary">
                    Drag and drop a CSV file here
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    or click to browse — hourly interval data works best
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              <p className="text-xs text-ink-muted mt-4 font-mono">
                Files stay in your browser for this preview — nothing is uploaded to a server.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
