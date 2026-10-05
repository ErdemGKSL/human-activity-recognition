import { Animate, Heading, SlideFrame, upper } from "../components";
import type { LayoutProps } from "../types";

/**
 * Each row is its own rounded card (one animation block), under a quiet
 * letter-spaced header. The first column is the row's name, so it is bold.
 */
export function Table({ slide, ...ctx }: LayoutProps<"table">) {
  const { theme } = ctx;
  const cell = { display: "flex", flex: 1, paddingLeft: 24, paddingRight: 24 } as const;
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          gap: 10,
          paddingBottom: theme.space.gap,
        }}
      >
        <div style={{ display: "flex", paddingBottom: 4 }}>
          {slide.columns.map((col) => (
            <span
              key={col}
              style={{
                ...cell,
                fontSize: theme.font.size.caption - 2,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: theme.colors.primary,
              }}
            >
              {upper(col, ctx.deck.lang)}
            </span>
          ))}
        </div>
        {/* Header rule as a sized box: single-side borders export as clip groups. */}
        <div style={{ display: "flex", height: 2, backgroundColor: theme.colors.primary }} />
        {slide.rows.map((row, r) => (
          <Animate
            key={row.join("|")}
            id={`row-${r}`}
            animation={{ effect: "entrance_fade", duration: 0.3 }}
            style={{
              alignItems: "center",
              paddingTop: 16,
              paddingBottom: 16,
              backgroundColor: theme.colors.surface,
              border: `1.5px solid ${theme.colors.border}`,
              borderRadius: theme.radius,
              fontSize: theme.font.size.caption + 2,
            }}
          >
            {row.map((value, c) => (
              <span
                key={`${slide.columns[c]}`}
                style={{ ...cell, fontWeight: c === 0 ? 700 : 400 }}
              >
                {value}
              </span>
            ))}
          </Animate>
        ))}
      </div>
    </SlideFrame>
  );
}
