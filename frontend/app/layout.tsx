import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";
export const metadata: Metadata = {
  title: "Gridly — Smart Energy. Smarter Future.",
  description:
    "AI-based energy consumption intelligence and optimization system for households, schools and offices, aligned with SDG 7.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <div className="energy-backdrop" aria-hidden="true" />
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0C1710",
              border: "1px solid rgba(232,240,226,0.12)",
              color: "#F3F5EC",
            },
          }}
        />
      </body>
    </html>
  );
}
