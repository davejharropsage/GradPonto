import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SkipToContent } from "@/components/shared/skip-to-content";
import { ScrollToTopButton } from "@/components/shared/scroll-to-top-button";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Variable font with a width axis, so headlines can be set condensed (see globals.css).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "GradPonto: find, apply and track UK placements",
    template: "%s | GradPonto",
  },
  description:
    "GradPonto helps UK graduates find placements, internships and apprenticeships, apply on the employer's site, and track every application in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${archivo.variable} ${ibmPlexMono.variable} h-full antialiased`}
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
