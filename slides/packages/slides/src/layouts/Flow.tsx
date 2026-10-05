import type { CSSProperties } from "react";
import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

/** Diameter of the numbered step marker that sits on the track. */
const MARKER = 60;
/** White ring between the marker and the track, so the line reads as passing behind it. */
const RING = 6;
/** Thickness of the track line. */
const TRACK = 4;

/**
 * A left-to-right pipeline drawn as a timeline: one track across the slide,
 * a large numbered marker per step on it, the step name under the marker and
 * its items as pills. The track is split into half-segments inside each step's
 * block (root groups must not overlap), so a step enters together with the
 * line that leads to it and the segments meet edge to edge.
 */
export function Flow({ slide, ...ctx }: LayoutProps<"flow">) {
  const { theme } = ctx;
  const last = slide.steps.length - 1;
  const segment = (visible: boolean): CSSProperties => ({
    display: "flex",
    flexGrow: 1,
    // Square ends: rounded ones show a notch where two steps' halves meet.
    height: TRACK,
    // The first and last step keep an empty half so every marker stays centred.
    backgroundColor: visible ? theme.colors.border : undefined,
  });
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
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          gap: theme.space.gap * 2,
          paddingBottom: theme.space.gap,
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {slide.steps.map((step, i) => {
            const accent = step.tone === "accent";
            const tone = accent ? theme.colors.accent : theme.colors.primary;
            return (
              <Animate
                key={step.label}
                id={`step-${i}`}
                animation={{ effect: "entrance_fade", duration: 0.4 }}
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignSelf: "stretch", alignItems: "center" }}>
                  <div style={segment(i > 0)} />
                  <div
                    style={{
                      display: "flex",
                      width: MARKER + RING * 2,
                      height: MARKER + RING * 2,
                      borderRadius: MARKER / 2 + RING,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: theme.colors.background,
                    }}
                  >
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
                        fontSize: theme.font.size.body + 2,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div style={segment(i < last)} />
                </div>
                <span
                  style={{
                    fontSize: theme.font.size.body,
                    fontWeight: 700,
                    color: accent ? tone : theme.colors.text,
                  }}
                >
                  {step.label}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {(step.items ?? []).map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        paddingTop: 5,
                        paddingBottom: 5,
                        paddingLeft: 14,
                        paddingRight: 14,
                        borderRadius: 18,
                        backgroundColor: theme.colors.surface,
                        border: `1.5px solid ${accent ? tone : theme.colors.border}`,
                        fontSize: theme.font.size.caption,
                        color: theme.colors.text,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Animate>
            );
          })}
        </div>
        {slide.points?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: theme.space.gap * 0.5 }}>
            {slide.points.map((point, i) => (
              <Animate
                key={point}
                id={`point-${i}`}
                animation={{ effect: "entrance_fade", duration: 0.4 }}
                style={{
                  alignItems: "stretch",
                  gap: theme.space.gap * 0.75,
                  padding: theme.space.gap * 0.75,
                  backgroundColor: theme.colors.surface,
                  border: `1.5px solid ${theme.colors.border}`,
                  borderRadius: theme.radius,
                }}
              >
                {/* Accent bar as a sized box: single-side borders become clip groups. */}
                <div
                  style={{
                    display: "flex",
                    width: 6,
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
      </div>
    </SlideFrame>
  );
}
