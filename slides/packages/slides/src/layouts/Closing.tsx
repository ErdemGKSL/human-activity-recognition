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
        <div
          style={{
            display: "flex",
            width: 96,
            height: 8,
            marginBottom: theme.space.gap * 1.5,
            backgroundColor: theme.colors.primary,
            borderRadius: 4,
          }}
        />
        <h1 style={{ margin: 0, fontSize: theme.font.size.display, fontWeight: 800 }}>
          {slide.title}
        </h1>
        {slide.subtitle ? (
          <span
            style={{
              display: "flex",
              marginTop: theme.space.gap * 1.25,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 999,
              backgroundColor: theme.colors.surface,
              border: `1.5px solid ${theme.colors.border}`,
              fontSize: theme.font.size.body,
              color: theme.colors.textMuted,
            }}
          >
            {slide.subtitle}
          </span>
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
