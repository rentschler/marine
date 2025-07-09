import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Providers } from "./providers";
import { fontSans } from "@/config/fonts";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "MARINE 360°",
    template: "MARINE 360°",
  },
  description: "MARINE 360°",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {





  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
            <div className="relative flex flex-col h-screen">
              {/*
              <header>
                <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                  <div className="inline-block max-w-xxl text-center justify-center flex flex-row gap-4">
                    <span className={title({ color: "blue" })}>Applied Visual Analytics 2025&nbsp;</span>
                    <div className="mt-3">
                      <ThemeSwitch />
                    </div>
                  </div>
                </section>
              </header>
              */}
              <main>{children}</main>
            </div>
        </Providers>
      </body>
    </html>
  );
}
