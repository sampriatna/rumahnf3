/** Token desain NF3 — map ke Tailwind existing (navy/gold/surface). */

export const colors = {
  primary: {
    50: "#f2f6fb",
    500: "#214f7c",
    700: "#12365c",
    800: "#0b2745",
    900: "#071b31"
  },
  surface: "#f5f8fb",
  surfaceRaised: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  accent: "#c99a2e"
} as const;

export const radius = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl"
} as const;

export const shadow = {
  card: "shadow-sm",
  elevated: "shadow-soft"
} as const;

export const spacing = {
  pageX: "px-4 lg:px-6",
  pageY: "py-6",
  section: "gap-6"
} as const;

export const shellLayout = {
  sidebarWidth: "w-60",
  sidebarCollapsed: "w-[4.5rem]",
  topBarHeight: "h-14",
  contentMax: "max-w-[1440px]"
} as const;

export const statusTone = {
  new: "bg-blue-50 text-blue-900 border-blue-200",
  active: "bg-sky-50 text-sky-900 border-sky-200",
  progress: "bg-amber-50 text-amber-900 border-amber-200",
  ready: "bg-emerald-50 text-emerald-900 border-emerald-200",
  success: "bg-emerald-50 text-emerald-900 border-emerald-300",
  danger: "bg-rose-50 text-rose-900 border-rose-300",
  muted: "bg-slate-100 text-slate-600 border-slate-200"
} as const;

export type StatusTone = keyof typeof statusTone;
