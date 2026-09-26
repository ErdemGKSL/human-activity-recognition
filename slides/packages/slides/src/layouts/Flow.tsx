import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Flow({ slide, ...ctx }: LayoutProps<"flow">) {
  const { theme } = ctx;
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
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {slide.steps.map((step, i) => {
          const accent = step.tone === "accent";
          const fill = accent ? theme.colors.accent : theme.colors.primary;
          return [
            i > 0 ? (
              // Connector: a bar plus a dot, not an arrow glyph (`→` is tofu in Geist)
              // and not a border triangle (single-side borders become clip groups).
              <div
                key={`link-${step.label}`}
                style={{ display: "flex", width: 32, alignItems: "center" }}
              >
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    height: 4,
                    backgroundColor: theme.colors.border,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.colors.textMuted,
                  }}
                />
              </div>
            ) : null,
            <Animate
              key={step.label}
              id={`step-${i}`}
              animation={{ effect: "entrance_fade", duration: 0.4 }}
              style={{
                flex: 1,
                flexDirection: "column",
                backgroundColor: theme.colors.surface,
                border: `2px solid ${fill}`,
                borderRadius: theme.radius,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "10px 14px",
                  backgroundColor: fill,
                  color: theme.colors.primaryContrast,
                  borderRadius: theme.radius - 4,
                }}
              >
                <span style={{ fontSize: theme.font.size.caption - 4, opacity: 0.85 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: theme.font.size.body, fontWeight: 700 }}>
                  {step.label}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 14,
                }}
              >
                {(step.items ?? []).map((item) => (
                  <span
                    key={item}
                    style={{
                      display: "flex",
                      padding: "6px 10px",
                      fontSize: theme.font.size.caption,
                      backgroundColor: theme.colors.background,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 8,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Animate>,
          ];
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
