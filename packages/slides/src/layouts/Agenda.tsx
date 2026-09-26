import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Agenda({ slide, ...ctx }: LayoutProps<"agenda">) {
  const { theme } = ctx;
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      <div style={{ display: "flex", flexDirection: "column", gap: theme.space.gap * 0.75 }}>
        {slide.items.map((item, i) => (
          <Animate
            key={item}
            id={`item-${i}`}
            animation={{ effect: "entrance_fly", options: { direction: "right" }, duration: 0.4 }}
            style={{ alignItems: "center", gap: theme.space.gap }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryContrast,
                fontSize: theme.font.size.caption,
                fontWeight: 700,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <span style={{ fontSize: theme.font.size.body + 4 }}>{item}</span>
          </Animate>
        ))}
      </div>
    </SlideFrame>
  );
}
