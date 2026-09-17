import Link from "next/link";
import {
  ArrowRight,
  Zap,
  LineChart,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  ScanSearch,
  ClipboardCheck,
  Leaf,
} from "lucide-react";
import { LandingChartPreview } from "@/components/LandingChartPreview";

const features = [
  {
    icon: LineChart,
    title: "Usage Pattern Analysis",
    description:
      "Breaks hourly readings into weekday, weekend and time-of-day patterns so you can see exactly where energy goes.",
  },
  {
    icon: TrendingUp,
    title: "Demand Forecasting",
    description:
      "Projects consumption 24 hours, 7 days or 30 days ahead using historical usage, weather and occupancy signals.",
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    description:
      "Flags readings that break from the expected pattern, from a stuck HVAC unit to an unplanned weekend spike.",
  },
  {
    icon: ScanSearch,
    title: "Wastage Identification",
    description:
      "Separates the base load a building actually needs from the load it's losing to idle equipment and schedules.",
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description:
      "Turns every finding into a ranked, concrete action with an estimated kWh and rupee saving attached.",
  },
];

const steps = [
  {
    icon: UploadCloud,
    title: "Upload energy data",
    description: "Bring in hourly meter readings as a CSV, or start from sample data.",
  },
  {
    icon: LineChart,
    title: "Analyze consumption patterns",
    description: "Gridly breaks usage down by hour, day and tariff period.",
  },
  {
    icon: ScanSearch,
    title: "Detect waste and forecast demand",
    description: "Anomalies get flagged and the next 30 days get projected.",
  },
  {
    icon: ClipboardCheck,
    title: "Act on recommendations and track savings",
    description: "Work through ranked actions and watch the savings tracker move.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-ink-primary leading-[1.08]">
              AI-based energy consumption intelligence &amp; optimization
            </h1>
            <p className="mt-5 text-ink-secondary text-base sm:text-lg leading-relaxed max-w-lg">
              Gridly reads raw electricity data and turns it into forecasts,
              anomaly alerts and concrete cost-saving actions — built for
              households, schools, offices and any organization watching a
              meter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="focus-ring inline-flex items-center gap-2 rounded bg-accent-gold px-5 py-3 text-sm font-semibold text-base-950 hover:bg-accent-gold/90 transition-colors"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="focus-ring inline-flex items-center gap-2 rounded border border-base-border px-5 py-3 text-sm font-medium text-ink-primary hover:border-white/25 transition-colors"
              >
                View How It Works
              </a>
            </div>
          </div>

          <LandingChartPreview />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-ink-primary text-center mb-2">
          Five ways Gridly reads your building
        </h2>
        <p className="text-center text-ink-muted text-sm max-w-md mx-auto mb-10">
          Each module works on the same data, answering a different question.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-base-border bg-base-surface/60 p-5 hover:border-accent-gold/30 transition-colors"
            >
              <f.icon className="h-5 w-5 text-accent-gold" strokeWidth={1.75} />
              <h3 className="mt-3 text-sm font-semibold text-ink-primary">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-ink-primary text-center mb-10">
          How it works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-card border border-base-border bg-base-surface/60 p-5">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-accent-indigo" />
                <span className="font-mono text-xs text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-primary">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="rounded-card border border-base-border bg-gradient-to-br from-base-surface/80 to-black/20 p-8 sm:p-10">
          <h2 className="text-xl font-semibold text-ink-primary mb-6">
            What the average deployment finds
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Impact value="12.4%" label="Average potential reduction" accent="text-accent-gold" />
            <Impact value="₹4,320" label="Estimated monthly savings" accent="text-status-savings" />
            <Impact value="74 kWh" label="Avoidable energy identified" accent="text-accent-indigo" />
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-base-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <Zap className="h-4 w-4 text-accent-gold" />
            Gridly — Smart Energy. Smarter Future.
          </div>
          <p className="text-xs text-ink-muted font-mono">
            Built in support of SDG 7: Affordable and Clean Energy for all.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Impact({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div>
      <p className={`text-3xl font-semibold tracking-tight ${accent}`}>{value}</p>
      <p className="text-sm text-ink-muted mt-1">{label}</p>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
      <Link href="/" className="focus-ring flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-gold/15 text-accent-gold">
          <Zap className="h-4 w-4" />
        </div>
        <span className="font-semibold text-ink-primary">
          Gridly <span className="text-accent-gold"></span>
        </span>
      </Link>
    </header>
  );
}
