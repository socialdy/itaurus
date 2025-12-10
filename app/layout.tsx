import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

// Placeholder imports - adjust paths as needed
import { Toaster } from "@/components/ui/sonner";
// import { ScreenSize } from "@/components/dev/screen-size"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

import { ThemeProvider } from "@/components/theme-provider";

let metadataBaseUrl: URL | undefined;
const appURLFromEnv = process.env.NEXT_PUBLIC_APP_URL;

try {
  if (appURLFromEnv && appURLFromEnv.trim() !== '') {
    metadataBaseUrl = new URL(appURLFromEnv);
  } else {
    console.warn('NEXT_PUBLIC_APP_URL is not set or is empty, using default http://localhost:3000 for metadataBase.');
    metadataBaseUrl = new URL('http://localhost:3000');
  }
} catch (e) {
  console.error('Failed to parse NEXT_PUBLIC_APP_URL. Using default http://localhost:3000 for metadataBase. Error:', e);
  metadataBaseUrl = new URL('http://localhost:3000'); // Fallback in case of parsing error
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: "iTaurus Wartungsmanagement",
  description:
    "Effiziente Planung, Durchführung und Dokumentation von Wartungsarbeiten.",
  openGraph: {
    images: "/itaurus-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <title>iTaurus Wartungsmanagement</title>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          {/* {process.env.APP_ENV === "development" && <ScreenSize />} */}
        </ThemeProvider>
      </body>
    </html>
  );
}