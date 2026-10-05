import type { CSSProperties } from "react";
import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

/** Gap between step cards; the connector line is drawn inside it. */
const CONNECTOR = 28;
/** Diameter of the numbered step marker. */
const MARKER = 36;
/** Inner padding of a step card; the connector aligns with the marker's centre. */
const PAD = 18;

/**
 * A left-to-right pipeline: one flat card per step (number, name, items as
 * plain lines), with no boxes nested inside a card. Each connector sits inside
 * the block of the step it leads to, so it enters together with that step
 * instead of showing before the cards.
 */
export function Flow({ slide, ...ctx }: LayoutProps<"flow">) {
  const { theme } = ctx;
  const row: CSSProperties = { display: "flex", alignItems: "flex-start" };
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      {slide.lead ? (
        <p
          style={{
            margin: 0,
            marginTop: -theme.space.gap,
            marginBottom: theme.space.gap * 1.25,
            fontSize: theme.font.size.body,
            color: theme.colors.textMuted,
          }}
        >
          {slide.lead}
        </p>
      ) : null}
      <div style={{ ...row, alignItems: "stretch" }}>
        {slide.steps.map((step, i) => {
          const tone = step.tone === "accent" ? theme.colors.accent : theme.colors.primary;
          return (
            <Animate
              key={step.label}
              id={`step-${i}`}
              animation={{ effect: "entrance_fade", duration: 0.4 }}
              // The connector's width sits in the flex basis so every card is the same width.
              style={{ flexGrow: 1, flexShrink: 1, flexBasis: i > 0 ? CONNECTOR : 0 }}
            >
              {i > 0 ? (
                // A plain line at marker height: no arrow glyph (`→` is tofu) and no
                // border triangle (single-side borders become clip groups).
                <div
                  style={{
                    display: "flex",
                    width: CONNECTOR,
                    height: 2,
                    marginTop: PAD + MARKER / 2 - 1,
                    backgroundColor: theme.colors.border,
                  }}
                />
              ) : null}
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: 14,
                  padding: PAD,
                  backgroundColor: theme.colors.surface,
                  border: `2px solid ${step.tone === "accent" ? tone : theme.colors.border}`,
                  borderRadius: theme.radius,
                }}
              >
                <div style={{ ...row, alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      width: MARKER,
                      height: MARKER,
                      borderRadius: MARKER / 2,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: tone,
                      color: theme.colors.primaryContrast,
                      fontSize: theme.font.size.caption - 2,
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontSize: theme.font.size.body - 2, fontWeight: 700 }}>
                    {step.label}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(step.items ?? []).map((item) => (
                    <span
                      key={item}
                      style={{ fontSize: theme.font.size.caption, color: theme.colors.textMuted }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Animate>
          );
        })}
      </div>
      {slide.points?.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap * 0.5,
            marginTop: theme.space.gap * 1.5,
          }}
        >
          {slide.points.map((point, i) => (
            <Animate
              key={point}
              id={`point-${i}`}
              animation={{ effect: "entrance_fade", duration: 0.4 }}
              style={{ alignItems: "flex-start", gap: theme.space.gap * 0.75 }}
            >
              <div
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  marginTop: 10,
                  borderRadius: 3,
                  backgroundColor: theme.colors.primary,
                }}
              />
              <span style={{ flex: 1, fontSize: theme.font.size.body, lineHeight: 1.35 }}>
                {point}
              </span>
            </Animate>
          ))}
        </div>
      ) : null}
    </SlideFrame>
  );
}
