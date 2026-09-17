"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { UploadDialog } from "./UploadDialog";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showControls?: boolean;
  actions?: ReactNode;
}

const BUILDINGS = ["Main Campus Building", "North Annex", "Hostel Block C"];
const RANGES = ["Last 7 days", "Last 30 days", "Last 90 days"];

export function Header({ title, subtitle, showControls = true, actions }: HeaderProps) {
  const [building, setBuilding] = useState(BUILDINGS[0]);
  const [range, setRange] = useState(RANGES[1]);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-base-border bg-base-950/80 backdrop-blur px-4 sm:px-6 h-auto min-h-16 py-3">
      <MobileNav />

      <div className="flex-1 min-w-[180px]">
        <h1 className="text-lg font-semibold text-ink-primary leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>

      {showControls && (
        <div className="flex items-center gap-2 flex-wrap">
          <Selector value={building} options={BUILDINGS} onChange={setBuilding} />
          <Selector value={range} options={RANGES} onChange={setRange} />
          <UploadDialog />
          {actions}
  
        </div>
      )}
      {!showControls && actions}
    </header>
  );
}

function Selector({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label="Selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring appearance-none rounded border border-base-border bg-white/5 pl-3 pr-8 py-2 text-sm text-ink-primary hover:border-accent-gold/35 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-base-surface">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted pointer-events-none" />
    </div>
  );
}
