import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SkipToContent } from "@/components/shared/skip-to-content";
import { ScrollToTopButton } from "@/components/shared/scroll-to-top-button";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PlacementPilot",
  description: "Track and tailor your placement applications, locally",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SkipToContent />
          {children}
          <ScrollToTopButton />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
