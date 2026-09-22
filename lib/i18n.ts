// The little bit of translation the site chrome needs. The site is English;
// the Spanish visitor page (/espanol) renders inside a Spanish layout so its
// header, footer, live banner and chat bubble read in Spanish too. Links
// still go to the English pages — the labels just tell a Spanish speaker
// what's behind them. Ministry names stay as they are (they're names).
export type Locale = "en" | "es";

const es = {
  skipToContent: "Ir al contenido",
  homeAria: "Faith Baptist Church of Chelsea — inicio",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  ministries: "Ministerios",
  visitShort: "Visita",
  nav: {
    "/about": "Acerca de",
    "/sermons": "Sermones",
    "/live": "En vivo",
    "/events": "Eventos",
    "/give": "Ofrendar",
    "/contact": "Contacto",
    "/common-questions": "Preguntas frecuentes",
    "/church-center-app": "App Church Center",
    "/plan-your-visit": "Planifique su visita",
    "/weekly-email": "Correo semanal",
    "/espanol": "Español",
  } as Record<string, string>,
  days: { Sunday: "Domingo", Wednesday: "Miércoles", Monday: "Lunes", Tuesday: "Martes", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado" } as Record<string, string>,
  services: {
    "Morning Service": "Servicio de la mañana",
    "Evening Service": "Servicio de la tarde",
    "Midweek Service": "Servicio de mitad de semana",
    "Sunday Morning Service": "Servicio del domingo por la mañana",
    "Sunday Evening Service": "Servicio del domingo por la tarde",
    "Special service": "Servicio especial",
  } as Record<string, string>,
  footer: {
    signupBlurb: "Un correo cada lunes (en inglés) — los eventos de la semana y el último mensaje.",
    sample: "¿Qué incluye? Vea un ejemplo →",
    serviceTimes: "Horarios de servicio",
    findUs: "Dónde estamos",
    quickLinks: "Enlaces",
  },
  subscribe: {
    placeholder: "usted@ejemplo.com",
    button: "Suscribirse",
    ok: "¡Listo! Nos vemos el lunes por la mañana.",
    fail: "Algo salió mal — intente de nuevo.",
  },
  live: {
    verified: (label: string) => `Estamos en vivo ahora — ${label}`,
    scheduled: (label: string) => `${label} está en curso`,
    watch: "Ver la transmisión en vivo",
  },
  ask: {
    title: "¿Preguntas sobre nuestra iglesia?",
    placeholder: "Escriba su pregunta…",
    send: "Enviar",
    open: "Hacer una pregunta sobre nuestra iglesia",
    close: "Cerrar el chat de preguntas",
  },
};

/** Label for a nav link: Spanish when we have one, otherwise the English label. */
export function navLabel(locale: Locale, href: string, fallback: string): string {
  return locale === "es" ? (es.nav[href] ?? fallback) : fallback;
}

export function serviceName(locale: Locale, name: string): string {
  return locale === "es" ? (es.services[name] ?? name) : name;
}

export function dayName(locale: Locale, day: string): string {
  return locale === "es" ? (es.days[day] ?? day) : day;
}

export const ES = es;
