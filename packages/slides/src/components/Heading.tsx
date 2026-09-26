import type { Theme } from "@pptx/core";
import type { ReactNode } from "react";

export function Heading({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <h1
      style={{
        margin: 0,
        marginBottom: theme.space.gap * 1.5,
        fontSize: theme.font.size.h1,
        fontWeight: 700,
        lineHeight: 1.15,
      }}
    >
      {children}
    </h1>
  );
}
