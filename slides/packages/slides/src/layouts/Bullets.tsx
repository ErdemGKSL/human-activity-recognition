import { Animate, Heading, SlideFrame, upper } from "../components";
import type { LayoutProps } from "../types";

/** Diameter of the numbered marker at the start of each point card. */
const MARKER = 36;

export function Bullets({ slide, ...ctx }: LayoutProps<"bullets">) {
  const { theme } = ctx;
  const label = (text: string) => (
    <span
      style={{
        fontSize: theme.font.size.caption - 2,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: theme.colors.primary,
        marginBottom: theme.space.gap * 0.75,
      }}
    >
      {upper(text, ctx.deck.lang)}
    </span>
  );
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      {slide.lead ? (
        <p
          style={{
            margin: 0,
            marginTop: -theme.space.gap,
            fontSize: theme.font.size.body,
            color: theme.colors.textMuted,
          }}
        >
          {slide.lead}
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: theme.space.gap * 2,
          flexGrow: 1,
          alignItems: "center",
          paddingBottom: theme.space.gap,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {slide.pointsLabel ? label(slide.pointsLabel) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: theme.space.gap * 0.6 }}>
            {slide.points.map((point, i) => (
              <Animate
                key={point}
                id={`point-${i}`}
                animation={{ effect: "entrance_fade", duration: 0.4 }}
                style={{
                  alignItems: "center",
                  gap: theme.space.gap * 0.75,
                  paddingTop: 14,
                  paddingBottom: 14,
                  paddingLeft: 18,
                  paddingRight: 24,
                  backgroundColor: theme.colors.surface,
                  border: `1.5px solid ${theme.colors.border}`,
                  borderRadius: theme.radius,
                }}
              >
                {/* Numbered disc as a sized box: bullet glyphs are not guaranteed in the font. */}
                <div
                  style={{
                    display: "flex",
                    flexShrink: 0,
                    width: MARKER,
                    height: MARKER,
                    borderRadius: MARKER / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.primaryContrast,
                    fontSize: theme.font.size.caption,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ flex: 1, fontSize: theme.font.size.body, lineHeight: 1.35 }}>
                  {point}
                </span>
              </Animate>
            ))}
          </div>
        </div>
        {slide.highlights?.length ? (
          <div style={{ display: "flex", flexDirection: "column", width: 330 }}>
            {slide.highlightsLabel ? label(slide.highlightsLabel) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: theme.space.gap * 0.5 }}>
              {slide.highlights.map((h, i) => (
                <Animate
                  key={`${h.label}-${h.value}`}
                  id={`highlight-${i}`}
                  animation={{ effect: "entrance_rise_up", duration: 0.4 }}
                  style={{
                    flexDirection: "column",
                    padding: "12px 18px",
                    backgroundColor: theme.colors.surface,
                    border: `1.5px solid ${theme.colors.border}`,
                    borderRadius: theme.radius,
                  }}
                >
                  <span
                    style={{ fontSize: theme.font.size.caption - 2, color: theme.colors.textMuted }}
                  >
                    {h.label}
                  </span>
                  <span
                    style={{
                      fontSize: theme.font.size.h2,
                      fontWeight: 800,
                      color: theme.colors.primary,
                    }}
                  >
                    {h.value}
                  </span>
                  {h.delta ? (
                    <span style={{ fontSize: theme.font.size.caption - 2 }}>{h.delta}</span>
                  ) : null}
                </Animate>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SlideFrame>
  );
}
