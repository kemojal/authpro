import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import ReactQueryProvider from "@/lib/query-client";
import { Navbar } from "@/components/navbar";
import { ToasterProvider } from "@/components/toaster-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuthPro",
  description: "A full-stack starter kit with authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="pt-16">{children}</div>
          </main>
          <ToasterProvider />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
