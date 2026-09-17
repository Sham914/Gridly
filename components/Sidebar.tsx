"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-base-border bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-base-border">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-gold/15 text-accent-gold">
          <Zap className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <span className="font-semibold tracking-tight text-ink-primary">
          WattWise <span className="text-accent-gold">AI</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/25"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-white/5 border border-transparent",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-base-border">
        <p className="text-xs text-ink-muted font-mono leading-relaxed">
          SDG 7 · Affordable &amp; Clean Energy
        </p>
      </div>
    </aside>
  );
}
