import { Animate, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Closing({ slide, ...ctx }: LayoutProps<"closing">) {
  const { theme } = ctx;
  return (
    <SlideFrame {...ctx} bare>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
        }}
      >
        <h1 style={{ margin: 0, fontSize: theme.font.size.display, fontWeight: 800 }}>
          {slide.title}
        </h1>
        {slide.subtitle ? (
          <p style={{ fontSize: theme.font.size.h2, color: theme.colors.textMuted }}>
            {slide.subtitle}
          </p>
        ) : null}
        {slide.contact ? (
          <Animate
            id="contact"
            animation={{ effect: "entrance_zoom", duration: 0.5 }}
            style={{
              marginTop: theme.space.gap,
              padding: "12px 28px",
              borderRadius: 999,
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryContrast,
              fontSize: theme.font.size.caption + 2,
              fontWeight: 600,
            }}
          >
            {slide.contact}
          </Animate>
        ) : null}
      </div>
    </SlideFrame>
  );
}
