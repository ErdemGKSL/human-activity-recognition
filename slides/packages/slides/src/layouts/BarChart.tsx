import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

/** Horizontal bar chart drawn with plain boxes — each bar exports as a native shape. */
export function BarChart({ slide, ...ctx }: LayoutProps<"bar-chart">) {
  const { theme } = ctx;
  const max = Math.max(...slide.data.map((d) => d.value), 1);
  const format = (v: number) =>
    slide.unit === "%" ? `${v}%` : slide.unit ? `${v}${slide.unit.replace(/^\$/, "")}` : `${v}`;
  const prefix = slide.unit?.startsWith("$") ? "$" : "";

  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: theme.space.gap * 0.75,
          flexGrow: 1,
        }}
      >
        {slide.data.map((d, i) => (
          <Animate
            key={d.label}
            id={`bar-${i}`}
            animation={{ effect: "entrance_wipe", options: { direction: "right" }, duration: 0.5 }}
            style={{ alignItems: "center", gap: theme.space.gap }}
          >
            <span
              style={{
                width: 240,
                fontSize: theme.font.size.caption + 2,
                color: theme.colors.textMuted,
              }}
            >
              {d.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 16 }}>
              <div
                style={{
                  width: `${(d.value / max) * 85}%`,
                  height: 40,
                  borderRadius: 6,
                  backgroundColor: i === 0 ? theme.colors.primary : theme.colors.surfaceMuted,
                }}
              />
              <span style={{ fontSize: theme.font.size.caption + 2, fontWeight: 700 }}>
                {prefix}
                {format(d.value)}
              </span>
            </div>
          </Animate>
        ))}
      </div>
      {slide.caption ? (
        <span
          style={{
            fontSize: theme.font.size.caption - 2,
            color: theme.colors.textMuted,
            marginBottom: 12,
          }}
        >
          {slide.caption}
        </span>
      ) : null}
    </SlideFrame>
  );
}
