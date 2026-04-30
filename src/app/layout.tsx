import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Kitchen Shift Scheduler",
  description: "Cloud kitchen shift scheduling tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
