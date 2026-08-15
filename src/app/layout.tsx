import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "Torneo de Póquer | Poker Tournament Manager",
  description: "Administra tu torneo de Texas Hold'em: niveles, jugadores, premios y reloj en vivo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <I18nProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
