import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { SessionProvider } from "next-auth/react";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resource Planner",
  description: "Bemanningsplanlegging for produktteam",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no">
      <body className={`${geist.className} antialiased bg-gray-50 min-h-screen`}>
        <SessionProvider>
          <Nav />
          <main className="max-w-screen-xl mx-auto px-4 py-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
