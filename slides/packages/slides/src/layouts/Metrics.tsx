import type { Theme, Tone } from "@pptx/core";
import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

function toneColor(theme: Theme, tone: Tone | undefined): string {
  if (tone === "positive") return theme.colors.positive;
  if (tone === "negative") return theme.colors.negative;
  return theme.colors.textMuted;
}

export function Metrics({ slide, ...ctx }: LayoutProps<"metrics">) {
  const { theme } = ctx;
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      <div style={{ display: "flex", gap: theme.space.gap, flexGrow: 1, alignItems: "center" }}>
        {slide.metrics.map((metric, i) => (
          <Animate
            key={metric.label}
            id={`metric-${i}`}
            animation={{ effect: "entrance_rise_up", duration: 0.5 }}
            style={{
              flexDirection: "column",
              flex: 1,
              padding: theme.space.gap * 1.25,
              backgroundColor: theme.colors.surface,
              border: `2px solid ${theme.colors.border}`,
              borderRadius: theme.radius,
            }}
          >
            <span style={{ fontSize: theme.font.size.caption, color: theme.colors.textMuted }}>
              {metric.label}
            </span>
            <span style={{ fontSize: theme.font.size.h1, fontWeight: 800, marginTop: 8 }}>
              {metric.value}
            </span>
            {metric.delta ? (
              <span
                style={{
                  fontSize: theme.font.size.caption,
                  fontWeight: 600,
                  marginTop: 8,
                  color: toneColor(theme, metric.tone),
                }}
              >
                {metric.delta}
              </span>
            ) : null}
          </Animate>
        ))}
      </div>
    </SlideFrame>
  );
}
