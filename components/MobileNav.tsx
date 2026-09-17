"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="focus-ring lg:hidden inline-flex h-9 w-9 items-center justify-center rounded border border-base-border text-ink-secondary hover:text-ink-primary"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-base-surface border-r border-base-border lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-base-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-gold/15 text-accent-gold">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-ink-primary">Gridly</span>
                </div>
                <button
                  aria-label="Close navigation menu"
                  onClick={() => setOpen(false)}
                  className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded text-ink-secondary hover:text-ink-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "focus-ring flex items-center gap-3 rounded px-3 py-2.5 text-sm",
                        active
                          ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/25"
                          : "text-ink-secondary hover:text-ink-primary hover:bg-white/5 border border-transparent",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
