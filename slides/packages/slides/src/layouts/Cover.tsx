import { Animate, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Cover({ slide, ...ctx }: LayoutProps<"cover">) {
  const { theme } = ctx;
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
          <Animate id="subtitle" animation={{ effect: "entrance_rise_up", duration: 0.5 }}>
            <p
              style={{
                marginTop: theme.space.gap,
                marginBottom: 0,
                fontSize: theme.font.size.h2,
                color: theme.colors.textMuted,
              }}
            >
              {slide.subtitle}
            </p>
          </Animate>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: theme.font.size.caption,
          color: theme.colors.textMuted,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>{slide.presenter ?? ""}</span>
          {slide.instructor ? <span>{slide.instructor}</span> : null}
        </div>
        <span>{slide.date ?? ""}</span>
      </div>
    </SlideFrame>
  );
}
