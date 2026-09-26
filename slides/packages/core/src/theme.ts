/**
 * Design tokens shared by every slide layout. Colors are uppercase #RRGGBB —
 * the form ppt-master's quality checker prefers — so no normalization is lost.
 */
export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryContrast: string;
    accent: string;
    positive: string;
    negative: string;
    border: string;
  };
  font: {
    /** Family name registered with Takumi (see @pptx/renderer fonts). */
    family: string;
    size: {
      display: number;
      h1: number;
      h2: number;
      body: number;
      caption: number;
    };
  };
  space: {
    /** Outer slide padding. */
    page: number;
    gap: number;
  };
  radius: number;
}

export const defaultTheme: Theme = {
  name: "slate",
  colors: {
    background: "#FFFFFF",
    surface: "#F8FAFC",
    surfaceMuted: "#E2E8F0",
    text: "#0F172A",
    textMuted: "#64748B",
    primary: "#2563EB",
    primaryContrast: "#FFFFFF",
    accent: "#F59E0B",
    positive: "#16A34A",
    negative: "#DC2626",
    border: "#CBD5E1",
  },
  font: {
    family: "Geist Sans",
    size: { display: 72, h1: 48, h2: 32, body: 24, caption: 18 },
  },
  space: { page: 72, gap: 24 },
  radius: 16,
};

/** Shallow-merge a partial theme (per color / size group) onto a base theme. */
export function extendTheme(base: Theme, patch: ThemePatch = {}): Theme {
  return {
    ...base,
    ...patch,
    colors: { ...base.colors, ...patch.colors },
    font: {
      ...base.font,
      ...patch.font,
      size: { ...base.font.size, ...patch.font?.size },
    },
    space: { ...base.space, ...patch.space },
  };
}

export interface ThemePatch {
  name?: string;
  colors?: Partial<Theme["colors"]>;
  font?: Partial<Omit<Theme["font"], "size">> & { size?: Partial<Theme["font"]["size"]> };
  space?: Partial<Theme["space"]>;
  radius?: number;
}
