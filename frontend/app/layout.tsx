import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Thumbnail AI | Viral YT Thumbnails in Seconds",
  description: "Transform your headshots into high-converting, viral YouTube thumbnails using Gemini 2.0 AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-zinc-100 font-sans selection:bg-[#d9ff45] selection:text-black">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,#1e1e1e,transparent)] pointer-events-none" />
        <Header />
        {children}
      </body>
    </html>
  );
}

