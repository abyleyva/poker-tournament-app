"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

// Routes meant to be shown standalone (TV display screen, invited-player view) —
// no site chrome, since they're often projected on a screen or opened on a
// player's phone via a shared link.
function isChromeless(pathname: string | null) {
  if (!pathname) return false;
  return /^\/tournaments\/[^/]+\/display(\/|$)/.test(pathname) || /^\/join\/[^/]+(\/|$)/.test(pathname);
}

export function NavBar() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();

  if (isChromeless(pathname)) return null;

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-emerald-400">
          <span aria-hidden>♠️</span>
          <span>{t("appName")}</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-neutral-300 hover:text-white transition-colors">
            {t("nav_home")}
          </Link>
          <Link
            href="/tournaments/new"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            {t("nav_new")}
          </Link>
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
          >
            {t("lang_toggle")}
          </button>
        </nav>
      </div>
    </header>
  );
}
