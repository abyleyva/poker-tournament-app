"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

const dictionaries = {
  es: {
    appName: "Torneo de Póquer",
    tagline: "Administra tu torneo de Texas Hold'em de principio a fin",
    nav_new: "Crear torneo",
    nav_home: "Inicio",
    lang_toggle: "English",

    home_title: "Tus torneos",
    home_subtitle: "Crea un torneo nuevo o continúa administrando uno que ya empezaste en este navegador.",
    home_empty: "Todavía no has creado ningún torneo en este navegador.",
    home_create_cta: "Crear un torneo nuevo",
    home_open_admin: "Panel de control",
    home_open_display: "Pantalla del reloj",
    home_forget: "Quitar de esta lista",

    wizard_title: "Configura tu torneo",
    wizard_section_general: "Datos generales",
    wizard_name: "Nombre del torneo",
    wizard_name_placeholder: "Ej. Torneo de Verano CMQ",
    wizard_currency: "Moneda",
    wizard_language: "Idioma de la aplicación",

    wizard_section_entries: "Control de entradas",
    wizard_buyIn: "Costo de entrada (buy-in)",
    wizard_startingStack: "Fichas iniciales",
    wizard_allowRebuy: "Permitir recompra (rebuy)",
    wizard_rebuyPrice: "Costo de la recompra",
    wizard_rebuyStack: "Fichas que da la recompra",
    wizard_maxRebuys: "Máximo de recompras por jugador (vacío = ilimitado)",
    wizard_allowAddOn: "Permitir add-on",
    wizard_addOnPrice: "Costo del add-on",
    wizard_addOnStack: "Fichas que da el add-on",

    wizard_section_levels: "Niveles de ciegas",
    wizard_level_small: "Ciega chica",
    wizard_level_big: "Ciega grande",
    wizard_level_ante: "Ante",
    wizard_level_duration: "Duración (min)",
    wizard_level_add: "Agregar nivel",
    wizard_level_add_break: "Agregar descanso",
    wizard_level_remove: "Eliminar",
    wizard_level_break_label: "Nombre del descanso",
    wizard_level_break: "Descanso",
    wizard_level_number: "Nivel {{n}}",
    wizard_level_duplicate_last: "Duplicar el último nivel de ciegas",

    wizard_section_prizes: "Premios",
    wizard_prizes_hint: "Define cuántos jugadores ganan premio y qué porcentaje de la bolsa recibe cada uno.",
    wizard_prize_position: "Lugar {{n}}",
    wizard_prize_percentage: "% de la bolsa",
    wizard_prize_add: "Agregar lugar premiado",
    wizard_prize_total: "Total asignado",
    wizard_prize_total_warning: "El total debe sumar 100%.",

    wizard_submit: "Crear torneo",
    wizard_submitting: "Creando...",
    wizard_error_generic: "Revisa los datos del formulario e intenta de nuevo.",

    admin_title: "Panel de control",
    admin_tab_clock: "Reloj",
    admin_tab_players: "Jugadores",
    admin_tab_prizes: "Premios",
    admin_tab_settings: "Configuración",
    admin_share_display: "Compartir pantalla del reloj",
    admin_share_admin: "Link de administrador (no lo compartas)",
    admin_copy: "Copiar",
    admin_copied: "¡Copiado!",

    clock_status_draft: "Sin iniciar",
    clock_status_running: "En curso",
    clock_status_paused: "Pausado",
    clock_status_finished: "Torneo terminado",
    clock_current_level: "Nivel actual",
    clock_next_level: "Siguiente",
    clock_blinds: "Ciegas",
    clock_ante: "Ante",
    clock_start: "Iniciar torneo",
    clock_pause: "Pausar",
    clock_resume: "Reanudar",
    clock_next: "Siguiente nivel",
    clock_prev: "Nivel anterior",
    clock_reset: "Reiniciar reloj",
    clock_players_left: "Jugadores activos",
    clock_avg_stack: "Stack promedio",
    clock_prize_pool: "Bolsa total",
    clock_no_levels: "Todavía no hay niveles configurados.",

    players_add_title: "Agregar jugador",
    players_name: "Nombre",
    players_email: "Correo (opcional)",
    players_add_cta: "Agregar e invitar",
    players_invite_link: "Link de invitación",
    players_invite_sent_hint: "Comparte este link con el jugador por WhatsApp, correo o el medio que prefieras.",
    players_status_active: "Activo",
    players_status_eliminated: "Eliminado",
    players_chip_count: "Fichas",
    players_rebuys: "Recompras",
    players_addons: "Add-ons",
    players_eliminate: "Eliminar del torneo",
    players_reactivate: "Reactivar",
    players_rebuy_cta: "Registrar recompra",
    players_addon_cta: "Registrar add-on",
    players_finish_position: "Lugar final",
    players_requested_rebuy: "Pidió recompra",
    players_none: "Todavía no has agregado jugadores.",
    players_remove: "Quitar",
    players_joined: "Abrió su link",
    players_not_joined: "No ha abierto su link",

    prizes_title: "Distribución de premios",
    prizes_pool: "Bolsa total acumulada",
    prizes_place: "Lugar",
    prizes_percentage: "Porcentaje",
    prizes_amount: "Monto",
    prizes_none: "No has definido premios todavía.",

    settings_title: "Configuración del torneo",
    settings_save: "Guardar cambios",
    settings_saved: "Cambios guardados",
    settings_locked_hint: "Algunos valores no se pueden cambiar una vez que el torneo inició.",

    display_waiting: "Esperando a que el organizador inicie el torneo",
    display_break: "DESCANSO",
    display_finished: "¡Torneo terminado!",
    display_entries: "Entradas",
    display_prize_pool: "Bolsa",
    display_scan_hint: "Pide tu link personal al organizador para ver tu stack",

    join_title: "Tu lugar en el torneo",
    join_your_stack: "Tu stack",
    join_your_position: "Tu posición",
    join_leaderboard: "Tabla de posiciones",
    join_request_rebuy: "Solicitar recompra",
    join_request_rebuy_sent: "Se notificó al organizador",
    join_eliminated_msg: "Fuiste eliminado del torneo. ¡Gracias por jugar!",
    join_not_started: "El torneo todavía no comienza.",

    common_minutes: "min",
    common_yes: "Sí",
    common_no: "No",
    common_loading: "Cargando...",
    common_error: "Algo salió mal",
    common_back: "Volver",
    common_cancel: "Cancelar",
    common_save: "Guardar",
    common_unlimited: "Ilimitado",
  },
  en: {
    appName: "Poker Tournament",
    tagline: "Run your Texas Hold'em tournament from start to finish",
    nav_new: "New tournament",
    nav_home: "Home",
    lang_toggle: "Español",

    home_title: "Your tournaments",
    home_subtitle: "Create a new tournament or keep managing one you already started in this browser.",
    home_empty: "You haven't created any tournaments in this browser yet.",
    home_create_cta: "Create a new tournament",
    home_open_admin: "Control panel",
    home_open_display: "Clock display",
    home_forget: "Remove from this list",

    wizard_title: "Set up your tournament",
    wizard_section_general: "General info",
    wizard_name: "Tournament name",
    wizard_name_placeholder: "E.g. CMQ Summer Tournament",
    wizard_currency: "Currency",
    wizard_language: "App language",

    wizard_section_entries: "Entries",
    wizard_buyIn: "Buy-in cost",
    wizard_startingStack: "Starting chip stack",
    wizard_allowRebuy: "Allow rebuys",
    wizard_rebuyPrice: "Rebuy price",
    wizard_rebuyStack: "Chips granted per rebuy",
    wizard_maxRebuys: "Max rebuys per player (blank = unlimited)",
    wizard_allowAddOn: "Allow add-on",
    wizard_addOnPrice: "Add-on price",
    wizard_addOnStack: "Chips granted per add-on",

    wizard_section_levels: "Blind levels",
    wizard_level_small: "Small blind",
    wizard_level_big: "Big blind",
    wizard_level_ante: "Ante",
    wizard_level_duration: "Duration (min)",
    wizard_level_add: "Add level",
    wizard_level_add_break: "Add break",
    wizard_level_remove: "Remove",
    wizard_level_break_label: "Break name",
    wizard_level_break: "Break",
    wizard_level_number: "Level {{n}}",
    wizard_level_duplicate_last: "Duplicate last blind level",

    wizard_section_prizes: "Prizes",
    wizard_prizes_hint: "Define how many players get paid and what percentage of the pool each one receives.",
    wizard_prize_position: "Place {{n}}",
    wizard_prize_percentage: "% of pool",
    wizard_prize_add: "Add paid place",
    wizard_prize_total: "Total assigned",
    wizard_prize_total_warning: "The total must add up to 100%.",

    wizard_submit: "Create tournament",
    wizard_submitting: "Creating...",
    wizard_error_generic: "Please review the form and try again.",

    admin_title: "Control panel",
    admin_tab_clock: "Clock",
    admin_tab_players: "Players",
    admin_tab_prizes: "Prizes",
    admin_tab_settings: "Settings",
    admin_share_display: "Share clock display",
    admin_share_admin: "Admin link (keep it private)",
    admin_copy: "Copy",
    admin_copied: "Copied!",

    clock_status_draft: "Not started",
    clock_status_running: "In progress",
    clock_status_paused: "Paused",
    clock_status_finished: "Tournament finished",
    clock_current_level: "Current level",
    clock_next_level: "Next",
    clock_blinds: "Blinds",
    clock_ante: "Ante",
    clock_start: "Start tournament",
    clock_pause: "Pause",
    clock_resume: "Resume",
    clock_next: "Next level",
    clock_prev: "Previous level",
    clock_reset: "Reset clock",
    clock_players_left: "Active players",
    clock_avg_stack: "Average stack",
    clock_prize_pool: "Total prize pool",
    clock_no_levels: "No levels configured yet.",

    players_add_title: "Add player",
    players_name: "Name",
    players_email: "Email (optional)",
    players_add_cta: "Add & invite",
    players_invite_link: "Invite link",
    players_invite_sent_hint: "Share this link with the player via WhatsApp, email, or however you like.",
    players_status_active: "Active",
    players_status_eliminated: "Eliminated",
    players_chip_count: "Chips",
    players_rebuys: "Rebuys",
    players_addons: "Add-ons",
    players_eliminate: "Eliminate from tournament",
    players_reactivate: "Reactivate",
    players_rebuy_cta: "Log rebuy",
    players_addon_cta: "Log add-on",
    players_finish_position: "Final place",
    players_requested_rebuy: "Requested rebuy",
    players_none: "You haven't added any players yet.",
    players_remove: "Remove",
    players_joined: "Opened their link",
    players_not_joined: "Hasn't opened their link",

    prizes_title: "Prize distribution",
    prizes_pool: "Total accumulated pool",
    prizes_place: "Place",
    prizes_percentage: "Percentage",
    prizes_amount: "Amount",
    prizes_none: "You haven't defined any prizes yet.",

    settings_title: "Tournament settings",
    settings_save: "Save changes",
    settings_saved: "Changes saved",
    settings_locked_hint: "Some values can't be changed once the tournament has started.",

    display_waiting: "Waiting for the organizer to start the tournament",
    display_break: "BREAK",
    display_finished: "Tournament finished!",
    display_entries: "Entries",
    display_prize_pool: "Prize pool",
    display_scan_hint: "Ask the organizer for your personal link to see your stack",

    join_title: "Your seat in the tournament",
    join_your_stack: "Your stack",
    join_your_position: "Your position",
    join_leaderboard: "Leaderboard",
    join_request_rebuy: "Request rebuy",
    join_request_rebuy_sent: "The organizer has been notified",
    join_eliminated_msg: "You were eliminated from the tournament. Thanks for playing!",
    join_not_started: "The tournament hasn't started yet.",

    common_minutes: "min",
    common_yes: "Yes",
    common_no: "No",
    common_loading: "Loading...",
    common_error: "Something went wrong",
    common_back: "Back",
    common_cancel: "Cancel",
    common_save: "Save",
    common_unlimited: "Unlimited",
  },
} as const;

export type DictKey = keyof (typeof dictionaries)["es"];

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "poker-tournament-lang";

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? "es");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "es" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  };

  const t = useMemo(() => {
    const dict = dictionaries[lang];
    return (key: DictKey, vars?: Record<string, string | number>) => {
      let str: string = dict[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        }
      }
      return str;
    };
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de I18nProvider");
  return ctx;
}
