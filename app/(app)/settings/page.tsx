import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";

export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings" subtitle="Building, units and notification preferences" showControls={false} />
      <div className="p-4 sm:p-6 space-y-6">
        <ChartCard title="Building profile">
          <p className="text-sm text-ink-secondary leading-relaxed">
            Building details, occupant counts and tariff rates used across
            Gridly's calculations will be configurable here in the
            production version.
          </p>
        </ChartCard>
        <ChartCard title="Notifications">
          <p className="text-sm text-ink-secondary leading-relaxed">
            Anomaly and budget-risk alert preferences will be configurable
            here in the production version.
          </p>
        </ChartCard>
      </div>
    </div>
  );
}
