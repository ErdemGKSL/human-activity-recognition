import { Animate, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Quote({ slide, ...ctx }: LayoutProps<"quote">) {
  const { theme } = ctx;
  return (
    <SlideFrame {...ctx} background={theme.colors.surface}>
      <div style={{ display: "flex", flexGrow: 1, gap: theme.space.gap * 1.5 }}>
        {/* Accent rule as a box, not border-left: single-side borders export as clip groups. */}
        <div style={{ width: 8, backgroundColor: theme.colors.accent }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          <Animate id="quote" animation={{ effect: "entrance_fade", duration: 0.8 }}>
            <p
              style={{
                margin: 0,
                fontSize: theme.font.size.h2 + 4,
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              “{slide.quote}”
            </p>
          </Animate>
          <Animate
            id="author"
            animation={{ effect: "entrance_rise_up", duration: 0.5 }}
            style={{ flexDirection: "column", marginTop: theme.space.gap * 1.5 }}
          >
            <span style={{ fontWeight: 700 }}>{slide.author}</span>
            {slide.role ? (
              <span style={{ fontSize: theme.font.size.caption, color: theme.colors.textMuted }}>
                {slide.role}
              </span>
            ) : null}
          </Animate>
        </div>
      </div>
    </SlideFrame>
  );
}
