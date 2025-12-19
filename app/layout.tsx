import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="bg-gray-100 min-h-screen">
          <div className="max-w-lg mx-auto bg-white min-h-screen shadow-xl relative">
            {children}
            <Navbar />
          </div>
        </div>
      </body>
    </html>
  );
}
