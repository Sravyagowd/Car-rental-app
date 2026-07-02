import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "@/components/Navbar";
import AiChatbot from "@/components/AiChatbot";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "INDDRIVE | Premium Indian Car Rental Management Platform",
  description: "Rent budget and family cars across major Indian hubs with simple daily/hourly plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
              {children}
            </main>
            {/* Premium Footer */}
            <footer className="w-full border-t border-border mt-16 bg-card py-10 px-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="font-bold text-lg mb-3">INDDRIVE</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    India's leading self-drive car rental agency. Experience premium hatchbacks, robust SUVs, and seamless pickups.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-sm mb-3">Quick Links</h5>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li><a href="/cars" className="hover:text-orange-500">Browse Cars</a></li>
                    <li><a href="/verification" className="hover:text-orange-500">Driving Verification</a></li>
                    <li><a href="/profile" className="hover:text-orange-500">My Booking Ledger</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-sm mb-3">Rental Policies</h5>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li><span className="cursor-pointer hover:text-orange-500">Cancellation Policy (24h free)</span></li>
                    <li><span className="cursor-pointer hover:text-orange-500">Refund Terms</span></li>
                    <li><span className="cursor-pointer hover:text-orange-500">GST Invoice Guidelines</span></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-sm mb-3">GSTin Details</h5>
                  <p className="text-xs text-muted-foreground">
                    Corporate Office: 100 Ft Rd, Indiranagar, Bengaluru, KA, India<br/>
                    GSTIN: 29AABBCCDD1122Z3
                  </p>
                </div>
              </div>
              <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
                © 2026 INDDRIVE Car Rentals. All rights reserved.
              </div>
            </footer>
            <AiChatbot />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
