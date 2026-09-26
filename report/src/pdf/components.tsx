import type { CSSProperties, ReactNode } from "react";
import { FONT_FAMILY, MONO_FAMILY } from "./fonts";
import { docTheme as t } from "./theme";

/**
 * Building blocks for JSX → PDF documents. Takumi lays out with flexbox, so
 * containers are `display: flex` and set their direction explicitly.
 * Headings stay real `h1`–`h3` elements: `renderPdf` builds the PDF outline
 * (bookmarks) from them.
 */

const column: CSSProperties = { display: "flex", flexDirection: "column" };

/** Root of every document: font, base size and color. */
export function Document({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        ...column,
        gap: t.gap,
        fontFamily: FONT_FAMILY,
        fontSize: t.size.body,
        lineHeight: t.lineHeight,
        color: t.colors.text,
      }}
    >
      {children}
    </div>
  );
}

export interface TitlePageProps {
  /** Small line above the title, e.g. the course or deliverable name. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Label/value rows under the title (authors, date, deadline…). */
  meta?: Array<[label: string, value: string]>;
}

/** A full first page; the next element starts on page 2. */
export function TitlePage({ eyebrow, title, subtitle, meta = [] }: TitlePageProps) {
  return (
    <div style={{ ...column, gap: 14, paddingTop: 180, breakAfter: "page" }}>
      {eyebrow && (
        <div
          style={{
            display: "flex",
            color: t.colors.primary,
            fontSize: t.size.h3,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h1 style={{ margin: 0, fontSize: t.size.title, fontWeight: 700, lineHeight: 1.2 }}>
        {title}
      </h1>
      {subtitle && (
        <div style={{ display: "flex", fontSize: t.size.h2, color: t.colors.textMuted }}>
          {subtitle}
        </div>
      )}
      <Rule color={t.colors.primary} width={80} />
      {meta.length > 0 && <KeyValue rows={meta} />}
    </div>
  );
}

/** A thin horizontal bar. (Full-size divs, not single-side borders, like the slides.) */
export function Rule({ color = t.colors.border, width }: { color?: string; width?: number }) {
  return (
    <div style={{ display: "flex", height: 3, width: width ?? "100%", backgroundColor: color }} />
  );
}

export interface SectionProps {
  title: string;
  /** Section number shown before the title, e.g. "2" or "2.1". */
  number?: string;
  /** Start this section on a new page. */
  newPage?: boolean;
  children?: ReactNode;
}

/** Top-level section (`h1`, appears in PDF bookmarks). */
export function Section({ title, number, newPage, children }: SectionProps) {
  return (
    <div style={{ ...column, gap: t.gap, breakBefore: newPage ? "page" : "auto" }}>
      <h1 style={{ margin: 0, marginTop: 8, fontSize: t.size.h1, fontWeight: 700 }}>
        {number ? `${number}. ${title}` : title}
      </h1>
      <Rule />
      {children}
    </div>
  );
}

/**
 * Second-level section (`h2`). Kept on one page when it fits: takumi-pdf has no
 * `break-after: avoid`, so this is what stops a heading from being orphaned.
 */
export function SubSection({ title, number, children }: Omit<SectionProps, "newPage">) {
  return (
    <div style={{ ...column, gap: 6, breakInside: "avoid" }}>
      <h2 style={{ margin: 0, marginTop: 4, fontSize: t.size.h2, fontWeight: 600 }}>
        {number ? `${number} ${title}` : title}
      </h2>
      {children}
    </div>
  );
}

/** Third-level heading (`h3`). */
export function Heading3({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ margin: 0, fontSize: t.size.h3, fontWeight: 600, color: t.colors.primary }}>
      {children}
    </h3>
  );
}

export function Paragraph({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      style={{
        margin: 0,
        textAlign: "justify",
        color: muted ? t.colors.textMuted : t.colors.text,
      }}
    >
      {children}
    </p>
  );
}

export function BulletList({ items, ordered }: { items: ReactNode[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List style={{ margin: 0, paddingLeft: 18 }}>
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
        <li key={i} style={{ marginBottom: 2 }}>
          {item}
        </li>
      ))}
    </List>
  );
}

/** Label/value rows, e.g. document metadata. */
export function KeyValue({ rows }: { rows: Array<[label: string, value: ReactNode]> }) {
  return (
    <div style={{ ...column, gap: 4 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", width: 140, color: t.colors.textMuted }}>{label}</div>
          <div style={{ display: "flex", flex: 1, fontWeight: 500 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export interface TableProps {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  /** Relative column widths (flex-grow); defaults to equal. */
  widths?: number[];
}

/** A simple data table built from flex rows; keeps rows from splitting across pages. */
export function Table({ columns, rows, caption, widths }: TableProps) {
  const cell = (i: number): CSSProperties => ({
    display: "flex",
    flex: widths?.[i] ?? 1,
    flexBasis: 0,
    padding: "4px 6px",
  });
  return (
    <div style={{ ...column, gap: 4 }}>
      <div style={{ ...column, border: `1px solid ${t.colors.border}`, borderRadius: t.radius }}>
        <div
          style={{
            display: "flex",
            backgroundColor: t.colors.primarySoft,
            fontWeight: 600,
            borderRadius: t.radius,
          }}
        >
          {columns.map((c, i) => (
            <div key={c} style={cell(i)}>
              {c}
            </div>
          ))}
        </div>
        {rows.map((row, r) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
            key={r}
            style={{
              display: "flex",
              breakInside: "avoid",
              backgroundColor: r % 2 ? t.colors.surface : "transparent",
            }}
          >
            {row.map((value, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
              <div key={i} style={cell(i)}>
                {value}
              </div>
            ))}
          </div>
        ))}
      </div>
      {caption && <Caption>{caption}</Caption>}
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontSize: t.size.small,
        color: t.colors.textMuted,
      }}
    >
      {children}
    </div>
  );
}

export type CalloutTone = "info" | "tip" | "todo";

const CALLOUT: Record<CalloutTone, { bar: string; bg: string }> = {
  info: { bar: t.colors.primary, bg: t.colors.primarySoft },
  tip: { bar: t.colors.accent, bg: t.colors.accentSoft },
  todo: { bar: t.colors.todo, bg: t.colors.todoSoft },
};

/** A tinted box with a title, e.g. "Fun fact" or "Presenter tip". */
export function Callout({
  title,
  tone = "info",
  children,
}: {
  title?: string;
  tone?: CalloutTone;
  children: ReactNode;
}) {
  const c = CALLOUT[tone];
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: 10,
        backgroundColor: c.bg,
        borderRadius: t.radius,
        breakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", width: 4, backgroundColor: c.bar, borderRadius: 2 }} />
      <div style={{ ...column, flex: 1, gap: 4 }}>
        {title && <div style={{ display: "flex", fontWeight: 600 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

/**
 * Marks content that is still to be written. Rendered in red so an unfinished
 * document is obvious at a glance; `grep -r "<Todo"` finds every gap.
 */
export function Todo({ children }: { children?: ReactNode }) {
  return (
    <Callout tone="todo" title="TODO">
      <Paragraph>{children ?? "Bu bölüm henüz yazılmadı."}</Paragraph>
    </Callout>
  );
}

/** A reserved box for a figure (plot, diagram, confusion matrix) not produced yet. */
export function FigurePlaceholder({ caption, height = 180 }: { caption: string; height?: number }) {
  return (
    <div style={{ ...column, gap: 4, breakInside: "avoid" }}>
      <div
        style={{
          display: "flex",
          height,
          alignItems: "center",
          justifyContent: "center",
          border: `1px dashed ${t.colors.border}`,
          borderRadius: t.radius,
          color: t.colors.textMuted,
          backgroundColor: t.colors.surface,
        }}
      >
        Şekil yer tutucusu
      </div>
      <Caption>{caption}</Caption>
    </div>
  );
}

/** Inline code / file names. */
export function Code({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: MONO_FAMILY, fontSize: t.size.small + 1 }}>{children}</span>;
}
