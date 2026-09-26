import type { ColorRef, StageObject, Theme } from "@pptx/core";
import type { CSSProperties } from "react";
import { Animate } from "../components";
import type { LayoutProps } from "../types";

export function resolveColor(theme: Theme, color: ColorRef): string {
  return color.startsWith("#") ? color : theme.colors[color as keyof Theme["colors"]];
}

const RADIUS: Record<StageObject["shape"], (o: StageObject, theme: Theme) => number> = {
  rect: () => 0,
  rounded: (_, theme) => theme.radius,
  circle: (o) => Math.min(o.width, o.height) / 2,
  pill: (o) => Math.min(o.width, o.height) / 2,
};

/**
 * Free-form slide: objects are absolutely positioned in canvas pixels, so the
 * same object (same `morph` key) can move, resize and recolor between
 * consecutive slides. This is the layout for Morph and motion showcases.
 */
export function Stage({ slide, theme }: LayoutProps<"stage">) {
  const abs = (x: number, y: number): CSSProperties => ({ position: "absolute", left: x, top: y });
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.font.family,
      }}
    >
      {slide.title ? (
        <h1
          style={{
            ...abs(theme.space.page, 48),
            margin: 0,
            fontSize: theme.font.size.h1 - 8,
            fontWeight: 700,
          }}
        >
          {slide.title}
        </h1>
      ) : null}
      {slide.objects.map((o) => (
        <Animate
          key={o.id}
          id={o.id}
          animation={o.animation}
          morph={o.morph}
          style={{
            ...abs(o.x, o.y),
            width: o.width,
            height: o.height,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            borderRadius: RADIUS[o.shape](o, theme),
            backgroundColor: resolveColor(theme, o.fill),
            color: resolveColor(theme, o.textColor ?? "primaryContrast"),
            fontSize: o.fontSize ?? theme.font.size.body,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {o.text ?? ""}
        </Animate>
      ))}
      {slide.caption ? (
        <span
          style={{
            ...abs(theme.space.page, 660),
            fontSize: theme.font.size.caption,
            color: theme.colors.textMuted,
          }}
        >
          {slide.caption}
        </span>
      ) : null}
    </div>
  );
}
