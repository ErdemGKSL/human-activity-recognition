import type { ReactNode } from "react";
import { Animate, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Cover({ slide, ...ctx }: LayoutProps<"cover">) {
  const { theme } = ctx;
  const meta = [slide.presenter, slide.instructor, slide.date].filter(Boolean) as string[];
  // Dividers as sized boxes between the meta items (single-side borders become clip groups).
  const strip: ReactNode[] = meta.flatMap((text, i) => [
    i > 0 ? (
      <div
        key={`divider-${text}`}
        style={{ display: "flex", width: 2, height: 28, backgroundColor: theme.colors.border }}
      />
    ) : null,
    <span key={text}>{text}</span>,
  ]);
  return (
    <SlideFrame {...ctx} bare>
      <div
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1 }}
      >
        <div
          style={{
            width: 96,
            height: 8,
            marginBottom: theme.space.gap * 1.5,
            backgroundColor: theme.colors.primary,
            borderRadius: 4,
          }}
        />
        <Animate id="title" animation={{ effect: "entrance_fade", duration: 0.8 }}>
          <h1
            style={{
              margin: 0,
              fontSize: theme.font.size.display,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {slide.title}
          </h1>
        </Animate>
        {slide.subtitle ? (
          <Animate
            id="subtitle"
            animation={{ effect: "entrance_rise_up", duration: 0.5 }}
            style={{ marginTop: theme.space.gap * 1.25 }}
          >
            <span
              style={{
                display: "flex",
                paddingTop: 8,
                paddingBottom: 8,
                paddingLeft: 20,
                paddingRight: 20,
                borderRadius: 999,
                backgroundColor: theme.colors.surface,
                border: `1.5px solid ${theme.colors.border}`,
                fontSize: theme.font.size.body,
                fontWeight: 700,
                color: theme.colors.primary,
              }}
            >
              {slide.subtitle}
            </span>
          </Animate>
        ) : null}
      </div>
      {meta.length ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.space.gap,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: theme.colors.surface,
            border: `1.5px solid ${theme.colors.border}`,
            borderRadius: theme.radius,
            fontSize: theme.font.size.caption,
            color: theme.colors.textMuted,
          }}
        >
          {strip}
        </div>
      ) : null}
    </SlideFrame>
  );
}
