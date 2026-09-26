/**
 * Design tokens for every PDF (reports and slide directions). Components read
 * these instead of hard-coding values, mirroring the slides' theme tokens.
 * Sizes are CSS px at 96 dpi (A4 = 794×1123 px).
 */
export const docTheme = {
  colors: {
    text: "#0F172A",
    textMuted: "#64748B",
    primary: "#2563EB",
    primarySoft: "#DBEAFE",
    accent: "#F59E0B",
    accentSoft: "#FEF3C7",
    surface: "#F8FAFC",
    border: "#CBD5E1",
    todo: "#DC2626",
    todoSoft: "#FEE2E2",
  },
  size: {
    title: 30,
    h1: 20,
    h2: 15,
    h3: 12.5,
    body: 11,
    small: 9,
  },
  lineHeight: 1.5,
  gap: 10,
  radius: 6,
} as const;

export type DocTheme = typeof docTheme;
