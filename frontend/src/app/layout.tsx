import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local RAG LLM",
  description: "Local RAG application with multi-model selection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Providers>
          <nav className="border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center gap-6">
              <a href="/" className="text-lg font-bold text-gray-800">
                Local RAG LLM
              </a>
              <a href="/chat" className="text-sm text-gray-600 hover:text-gray-900">
                Chat
              </a>
              <a href="/documents" className="text-sm text-gray-600 hover:text-gray-900">
                Documents
              </a>
              <a href="/collections" className="text-sm text-gray-600 hover:text-gray-900">
                Collections
              </a>
            </div>
          </nav>
          <main className="mx-auto max-w-7xl p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
