import { Animate, Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Table({ slide, ...ctx }: LayoutProps<"table">) {
  const { theme } = ctx;
  const cell = { flex: 1, padding: "14px 20px" } as const;
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryContrast,
            fontWeight: 700,
            fontSize: theme.font.size.caption + 2,
          }}
        >
          {slide.columns.map((col) => (
            <span key={col} style={cell}>
              {col}
            </span>
          ))}
        </div>
        {slide.rows.map((row, r) => (
          <Animate
            key={row.join("|")}
            id={`row-${r}`}
            animation={{ effect: "entrance_fade", duration: 0.3 }}
            style={{ flexDirection: "column" }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: r % 2 ? theme.colors.surface : theme.colors.background,
                fontSize: theme.font.size.caption + 2,
              }}
            >
              {row.map((value, c) => (
                <span key={`${slide.columns[c]}`} style={cell}>
                  {value}
                </span>
              ))}
            </div>
            {/* Row rule as a box, not border-bottom: single-side borders export as clip groups. */}
            <div style={{ height: 1, backgroundColor: theme.colors.border }} />
          </Animate>
        ))}
      </div>
    </SlideFrame>
  );
}
