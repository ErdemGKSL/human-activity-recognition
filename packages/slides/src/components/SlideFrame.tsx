import type { CSSProperties, ReactNode } from "react";
import type { SlideContext } from "../types";

interface SlideFrameProps extends SlideContext {
  children: ReactNode;
  /** Override the page background (e.g. primary color on section slides). */
  background?: string;
  color?: string;
  /** Hide the footer (deck title + page number). */
  bare?: boolean;
  style?: CSSProperties;
}

/**
 * Full-canvas root every layout renders into. Takumi renders this at the
 * canvas size passed to renderSvg, so width/height are 100%.
 */
export function SlideFrame({
  children,
  theme,
  deck,
  index,
  total,
  background,
  color,
  bare,
  style,
}: SlideFrameProps) {
  const fg = color ?? theme.colors.text;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: theme.space.page,
        backgroundColor: background ?? theme.colors.background,
        color: fg,
        fontFamily: theme.font.family,
        fontSize: theme.font.size.body,
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>{children}</div>
      {bare ? null : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: theme.font.size.caption - 4,
            color: color ?? theme.colors.textMuted,
            opacity: color ? 0.7 : 1,
          }}
        >
          <span>{deck.title}</span>
          <span>
            {index + 1} / {total}
          </span>
        </div>
      )}
    </div>
  );
}
