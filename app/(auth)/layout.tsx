import type { Metadata } from "next";
import "../globals.css"; // Important: ../ because it's in (auth)/
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "iTaurus Wartungsmanagement - Authentifizierung",
  description: "Login oder Registrierung für iTaurus Wartungsmanagement",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* No Sidebar here! */}
      {children}
    </ThemeProvider>
  );
} 