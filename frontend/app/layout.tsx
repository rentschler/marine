import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import React from 'react';

import { Providers } from './providers';

import { fontSans } from '@/config/fonts';

export const metadata: Metadata = {
  title: {
    default: 'MARINE',
    template: 'MARINE',
  },
  description: 'MARINE',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: 'white' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={clsx('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'light' }}>
          <div className="relative flex flex-col h-screen">
            {/* Simple Navbar */}
            <nav className="w-full bg-primary text-white px-6 py-2 shadow flex items-center justify-between">
              <span className="font-bold text-lg tracking-wide">
                MARINE Analytics for Radio Interception and Naval Environment
              </span>
              <div className="flex items-center space-x-6">
                <a
                  className="hover:text-blue-200 transition-colors"
                  href="https://vast-challenge.github.io/2025/MC3.html"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  VAST Challenge 2025 MC3
                </a>
                <span className="text-sm">Willi Kneer & Jonathan Rentschler</span>
              </div>
            </nav>
            {/* End Navbar */}
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
