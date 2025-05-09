import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Providers } from "./providers";
import { fontSans } from "@/config/fonts";

import { title } from "@/components/primitives";
import { ThemeSwitch } from "@/components/theme-switch";
import React from "react";
import { CustomLink } from "@/components/ui/link";

export const metadata: Metadata = {
  title: {
    default: "AVA Template",
    template: "AVA Template",
  },
  description: "AVA Template",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
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
            <header>
              <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xxl text-center justify-center flex flex-row gap-4">
                  <span className={title({ color: "blue" })}>Applied Visual Analytics 2025&nbsp;</span>
                  <div className="mt-3">
                    <ThemeSwitch />
                  </div>
                  <CustomLink href="/" className="my-auto">Home</CustomLink>
                  <CustomLink href="/graph" className="my-auto">Default</CustomLink>
                  <CustomLink href="/graph?layout=force" className="my-auto">Force</CustomLink>
                  <CustomLink href="/graph?layout=circular" className="my-auto">Circular</CustomLink>
                  <CustomLink href="/graph?layout=atlas2" className="my-auto">Atlas2</CustomLink>
                  <CustomLink href="/graph?layout=circlepack" className="my-auto">Circlepack</CustomLink>
                  <CustomLink href="/graph?layout=noverlap" className="my-auto">Noverlap</CustomLink>

                </div>
              </section>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
