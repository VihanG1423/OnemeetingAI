import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OneMeeting - AI-Powered Venue Booking",
  description:
    "Find and book the perfect meeting venue in the Netherlands with AI assistance. 1500+ venues across Amsterdam, Rotterdam, Utrecht, The Hague, and Eindhoven.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Lava lamp gradient background */}
        <div className="lava-lamp" aria-hidden="true">
          <div className="lava-blob lava-blob-1" />
          <div className="lava-blob lava-blob-2" />
          <div className="lava-blob lava-blob-3" />
          <div className="lava-blob lava-blob-4" />
          <div className="lava-blob lava-blob-5" />
          <div className="lava-blob lava-blob-6" />
        </div>
        <div className="grain-overlay" aria-hidden="true">
          <svg>
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>
        <div className="vignette-overlay" aria-hidden="true" />

        <div className="relative z-10">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(15, 15, 30, 0.90)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                backdropFilter: "blur(20px)",
              },
            }}
          />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
