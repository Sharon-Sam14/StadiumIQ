import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StadiumIQ Command Center — FIFA World Cup 2026",
  description:
    "Enterprise-grade real-time operational intelligence dashboard for venue management and security control during the FIFA World Cup 2026.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
