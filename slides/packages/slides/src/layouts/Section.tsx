import { Animate, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Section({ slide, ...ctx }: LayoutProps<"section">) {
  const { theme } = ctx;
  return (
    <SlideFrame {...ctx} background={theme.colors.primary} color={theme.colors.primaryContrast}>
      <div
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1 }}
      >
        {slide.eyebrow ? (
          <span
            style={{
              fontSize: theme.font.size.caption,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            {slide.eyebrow}
          </span>
        ) : null}
        <h1
          style={{
            margin: 0,
            marginTop: theme.space.gap / 2,
            fontSize: theme.font.size.display - 8,
            fontWeight: 800,
          }}
        >
          {slide.title}
        </h1>
        {slide.description ? (
          <Animate id="description" animation={{ effect: "entrance_fade", duration: 0.6 }}>
            <p
              style={{
                marginTop: theme.space.gap,
                fontSize: theme.font.size.h2 - 4,
                maxWidth: 900,
              }}
            >
              {slide.description}
            </p>
          </Animate>
        ) : null}
      </div>
    </SlideFrame>
  );
}
