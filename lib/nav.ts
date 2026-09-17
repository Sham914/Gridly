import {
  LayoutDashboard,
  LineChart,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Usage Analytics", href: "/analytics", icon: LineChart },
  { label: "Forecast", href: "/forecast", icon: TrendingUp },
  { label: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { label: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];
