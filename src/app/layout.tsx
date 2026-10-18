import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "League Management",
    template: "%s · League Management",
  },
  description:
    "Multi-league platform — create and manage local football leagues, teams, fixtures, standings and predictions.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "League Management",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="flex-1 pb-16 md:pb-4">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
