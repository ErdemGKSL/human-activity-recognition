/**
 * Deck data → DeckCraft commands → .pptx and slide PDF / PNG exports.
 *
 * DeckCraft's CLI runs one command list per process and does not keep state
 * between calls, so the deck is built in stages: each stage loads the previous
 * `.deckcraft` file (`--in`), runs its commands and saves the next one
 * (`--save`). Every stage starts with `slide.go`, because commands act on the
 * selected slide. Table cells and text styling need ids that only exist after
 * a command has run, so those take a second stage (`after`).
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { DeckSpec, SlideSpec } from "../deck/types";

/**
 * Colours and fonts. One ink colour for text and dark backgrounds, one blue
 * accent for emphasis, one font family. Keep it to these: a deck that uses
 * more hues than this looks like a template, not a designed deck.
 */
export const THEME = {
  colors: {
    dk1: "#14213D", // ink: titles, dark backgrounds
    lt1: "#FFFFFF", // page
    dk2: "#3D4B5C", // body text, plain flow steps
    lt2: "#F4F5F7", // quiet panels
    accent1: "#1F5FAD", // the one accent: rules, emphasis, the outcome step
    accent2: "#D9822B",
    accent3: "#6B7A8F",
    accent4: "#A3ADBB", // arrows between flow steps
    accent5: "#2E7D5B",
    accent6: "#8E44AD",
    muted: "#C5CFDD", // secondary text on dark backgrounds
  },
  font: "Inter",
} as const;

/** A DeckCraft slide is 960 × 540 pt (16:9). Coordinates below are in points. */
const SLIDE = { width: 960, height: 540 };
const MARGIN_X = 60;

/** Text sizes in points. Titles are large enough to read from the back of a room. */
const TYPE = {
  title: 32,
  body: 20,
  coverTitle: 44,
  coverSubtitle: 20,
  flow: 14,
} as const;

/** One call to `deckcraft-cli run`. `after` builds the commands that need the previous stage's output. */
export interface Stage {
  /** Name shown in logs. */
  label: string;
  cmds: string[];
  /** Commands that need an id printed by this stage (a table id, a shape id, a slide id). */
  after?: (printed: Map<string, unknown>) => string[];
}

/** Serialises one command: `id={json params}`, the form `deckcraft-cli run --cmd` reads. */
export function cmd(id: string, params?: Record<string, unknown>): string {
  return params === undefined ? id : `${id}=${JSON.stringify(params)}`;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Commands that style the whole deck once, before any slide exists. */
export function themeCommands(): string[] {
  return [
    cmd("design.colors", { colors: THEME.colors }),
    cmd("design.fonts", { major: THEME.font, minor: THEME.font }),
  ];
}

interface TextStyle {
  color?: string;
  size?: number;
  bold?: boolean;
  align?: "left" | "center";
}

/**
 * Sets colour, size and weight of one shape's whole text. DeckCraft only
 * formats a selection, so this selects the shape, enters text edit, selects
 * all, formats and leaves edit mode again.
 */
export function styleText(id: number, style: TextStyle): string[] {
  return [
    cmd("selection.select", { ids: [id] }),
    cmd("text.edit", {}),
    cmd("text.selectAll", {}),
    ...(style.color ? [cmd("format.color", { color: style.color })] : []),
    ...(style.size ? [cmd("format.size", { size: style.size })] : []),
    ...(style.bold !== undefined ? [cmd("format.bold", { on: style.bold })] : []),
    cmd("text.exit", {}),
  ];
}

/**
 * Same as styleText, for the shape or text box that was just inserted: insert
 * commands leave their new object selected, so no `selection.select` is needed.
 */
function inlineText(style: TextStyle): string[] {
  return [
    cmd("text.edit", {}),
    cmd("text.selectAll", {}),
    ...(style.color ? [cmd("format.color", { color: style.color })] : []),
    ...(style.size ? [cmd("format.size", { size: style.size })] : []),
    ...(style.bold !== undefined ? [cmd("format.bold", { on: style.bold })] : []),
    ...(style.align ? [cmd("format.align", { align: style.align })] : []),
    cmd("text.exit", {}),
  ];
}

/** Title and body text styles for a light content slide. */
const TITLE_ON_LIGHT: TextStyle = { color: THEME.colors.dk1, size: TYPE.title, bold: true };
const BODY_ON_LIGHT: TextStyle = { color: THEME.colors.dk2, size: TYPE.body };
const LABEL_ON_LIGHT: TextStyle = { color: THEME.colors.accent1, size: 16, bold: true };
const CARD_TEXT: TextStyle = { color: THEME.colors.dk1, size: TYPE.body, align: "left" };
const TITLE_ON_DARK: TextStyle = { color: THEME.colors.lt1, size: TYPE.coverTitle, bold: true };
const SUBTITLE_ON_DARK: TextStyle = { color: THEME.colors.muted, size: TYPE.coverSubtitle };

/**
 * A short accent rule under the title. It is the only decoration on a content
 * slide, so it carries the deck's colour without adding clutter.
 */
function accentRule(): string[] {
  return [
    cmd("shape.insert", { preset: "rect", rect: [MARGIN_X, 124, 56, 4] }),
    cmd("shape.fill", { color: THEME.colors.accent1 }),
    cmd("shape.line", { none: true }),
  ];
}

/**
 * One point as a card: a pale panel with a blue bar at its left edge. Cards
 * replace bullets, so every point reads as one unit and the slide has no
 * empty lower half.
 */
function pointCard(line: string, top: number, height: number): string[] {
  const barWidth = 6;
  return [
    cmd("shape.insert", { preset: "rect", rect: [MARGIN_X, top, barWidth, height] }),
    cmd("shape.fill", { color: THEME.colors.accent1 }),
    cmd("shape.line", { none: true }),
    cmd("shape.insert", {
      preset: "rect",
      rect: [MARGIN_X + barWidth, top, SLIDE.width - 2 * MARGIN_X - barWidth, height],
      text: line,
    }),
    cmd("shape.fill", { color: THEME.colors.lt2 }),
    cmd("shape.line", { none: true }),
    ...inlineText(CARD_TEXT),
  ];
}

/** Dark slides (cover, closing) get a solid ink background instead of the white page. */
const darkBackground = (): string[] => [cmd("design.background", { color: THEME.colors.dk1 })];

/** The id of the slide that a stage just created, as printed by `slide.new`. */
function slideIdOf(printed: Map<string, unknown>): number {
  const value = printed.get("slide.new");
  if (typeof value === "object" && value !== null && "id" in value) {
    return (value as { id: number }).id;
  }
  throw new Error("slide.new printed no id");
}

/**
 * Stages for one slide. The slide is appended at the end of the deck, so its
 * index is `index`; every `slide.new` is followed by `slide.go` so the commands
 * after it act on that slide.
 *
 * Placeholder ids: a new slide gets its id, then its title placeholder gets
 * id + 1 and its body or subtitle placeholder id + 2. Rendering the deck checks
 * this; if DeckCraft changes the numbering, the rendered slides show it.
 */
export function slideStages(
  slide: SlideSpec,
  index: number,
  transition?: DeckSpec["transition"],
): Stage[] {
  return slideStagesRaw(slide, index, transition).map((stage) => ({
    ...stage,
    // `at` pins the position: without it DeckCraft inserts after the selected slide, which reverses the deck.
    cmds: stage.cmds.flatMap((c) =>
      c.startsWith("slide.new=") ? [withAt(c, index), cmd("slide.go", { index })] : [c],
    ),
  }));
}

function withAt(newCmd: string, index: number): string {
  const params = JSON.parse(newCmd.slice(newCmd.indexOf("=") + 1)) as Record<string, unknown>;
  return cmd("slide.new", { ...params, at: index });
}

function slideStagesRaw(
  slide: SlideSpec,
  index: number,
  transition?: DeckSpec["transition"],
): Stage[] {
  const fade = transition
    ? [
        cmd("transition.set", {
          kind: transition.effect,
          duration: Math.round(transition.duration * 1000),
          index,
        }),
      ]
    : [];

  switch (slide.layout) {
    case "cover":
      return [
        {
          label: `${slide.id}: cover`,
          cmds: [
            cmd("slide.new", {
              layout: "title",
              title: text(slide.title),
              body: [slide.subtitle, slide.presenter, slide.instructor, slide.date]
                .map(text)
                .join("\n"),
            }),
            ...darkBackground(),
            // A short blue bar centred above the title, the cover's only decoration.
            cmd("shape.insert", { preset: "rect", rect: [450, 120, 60, 4] }),
            cmd("shape.fill", { color: THEME.colors.accent1 }),
            cmd("shape.line", { none: true }),
            ...fade,
          ],
          after: (printed) => {
            const id = slideIdOf(printed);
            return [
              cmd("slide.go", { index }),
              ...styleText(id + 1, TITLE_ON_DARK),
              ...styleText(id + 2, SUBTITLE_ON_DARK),
            ];
          },
        },
      ];

    case "bullets": {
      // Lead line and label are text boxes above the cards. Only the points become cards,
      // so the label never carries a bullet.
      const lead = text(slide.lead);
      const label = text(slide.pointsLabel);
      const points = (Array.isArray(slide.points) ? slide.points.map(text) : []).filter(Boolean);
      const cmds: string[] = [...accentRule()];
      let y = 150;
      if (lead) {
        // About 80 characters fit one line at 20 pt across the content width.
        const leadHeight = Math.ceil(lead.length / 80) * 28 + 12;
        cmds.push(
          cmd("insert.textBox", {
            rect: [MARGIN_X, y, SLIDE.width - 2 * MARGIN_X, leadHeight],
            text: lead,
          }),
        );
        cmds.push(...inlineText(BODY_ON_LIGHT));
        y += leadHeight + 8;
      }
      if (label) {
        cmds.push(cmd("insert.textBox", { rect: [MARGIN_X, y, 400, 28], text: label }));
        cmds.push(...inlineText(LABEL_ON_LIGHT));
        y += 36;
      }
      // Cards share the space down to the footer; a card is never taller than 76 pt.
      const gap = 14;
      const bottom = 470;
      const cardHeight = Math.min(76, (bottom - y - gap * (points.length - 1)) / points.length);
      cmds.push(
        ...points.flatMap((line, i) => pointCard(line, y + i * (cardHeight + gap), cardHeight)),
        ...fade,
      );
      return [
        {
          label: `${slide.id}: cards`,
          cmds: [cmd("slide.new", { layout: "titleOnly", title: text(slide.title) }), ...cmds],
          after: (printed) => {
            const id = slideIdOf(printed);
            return [cmd("slide.go", { index }), ...styleText(id + 1, TITLE_ON_LIGHT)];
          },
        },
      ];
    }

    case "flow":
      return [
        {
          label: `${slide.id}: flow`,
          cmds: [
            cmd("slide.new", { layout: "titleOnly", title: text(slide.title) }),
            ...accentRule(),
            ...flowShapes(slide.steps),
            ...(Array.isArray(slide.points)
              ? [
                  cmd("insert.textBox", {
                    rect: [MARGIN_X, 380, SLIDE.width - 2 * MARGIN_X, 90],
                    text: slide.points.map(text).join("\n"),
                  }),
                ]
              : []),
            ...fade,
          ],
          after: (printed) => {
            const id = slideIdOf(printed);
            return [cmd("slide.go", { index }), ...styleText(id + 1, TITLE_ON_LIGHT)];
          },
        },
      ];

    case "table": {
      const columns = Array.isArray(slide.columns) ? slide.columns.map(text) : [];
      const rows = Array.isArray(slide.rows) ? (slide.rows as unknown[][]) : [];
      const rowCount = rows.length + 1;
      const tableRect = [MARGIN_X, 150, SLIDE.width - 2 * MARGIN_X, rowCount * 44];
      return [
        {
          label: `${slide.id}: table`,
          cmds: [
            cmd("slide.new", { layout: "titleOnly", title: text(slide.title) }),
            ...accentRule(),
            cmd("insert.table", { rows: rowCount, cols: columns.length, rect: tableRect }),
            cmd("table.style", { style: "medium2-accent1" }),
            ...fade,
          ],
          after: (printed) => {
            const id = printed.get("insert.table");
            const tableId =
              typeof id === "object" && id !== null && "id" in id
                ? (id as { id: number }).id
                : undefined;
            if (tableId === undefined) throw new Error(`${slide.id}: insert.table printed no id`);
            const cells: [number, number, string][] = [
              ...columns.map((c, i): [number, number, string] => [0, i, c]),
              ...rows.flatMap((row, r) =>
                row.map((v, c): [number, number, string] => [r + 1, c, text(v)]),
              ),
            ];
            // A reloaded document selects slide 0, so the table's slide must be selected first.
            return [
              cmd("slide.go", { index }),
              ...cells.map(([r, c, value]) =>
                cmd("text.set", { id: tableId, text: value, cell: [r, c] }),
              ),
              ...styleText(slideIdOf(printed) + 1, TITLE_ON_LIGHT),
            ];
          },
        },
      ];
    }

    case "closing":
      return [
        {
          label: `${slide.id}: closing`,
          cmds: [
            cmd("slide.new", {
              layout: "sectionHeader",
              title: text(slide.title),
              body: text(slide.subtitle),
            }),
            ...darkBackground(),
            ...fade,
          ],
          after: (printed) => {
            const id = slideIdOf(printed);
            return [
              cmd("slide.go", { index }),
              ...styleText(id + 1, TITLE_ON_DARK),
              ...styleText(id + 2, SUBTITLE_ON_DARK),
            ];
          },
        },
      ];

    default:
      throw new Error(`${slide.id}: no DeckCraft mapping for layout "${slide.layout}"`);
  }
}

/**
 * Process steps: rounded boxes joined by small arrows. Plain steps are dark
 * slate with white text; the outcome step is the accent blue so the eye lands
 * on it last.
 */
function flowShapes(steps: unknown): string[] {
  if (!Array.isArray(steps) || steps.length === 0) return [];
  const count = steps.length;
  const gap = 36;
  const width = (SLIDE.width - 2 * MARGIN_X - gap * (count - 1)) / count;
  const top = 200;
  const height = 150;
  return steps.flatMap((step, i) => {
    const s = step as { label?: unknown; items?: unknown; tone?: unknown };
    const x = MARGIN_X + i * (width + gap);
    const accent = s.tone === "accent";
    const label = [text(s.label), ...(Array.isArray(s.items) ? s.items.map(text) : [])].join("\n");
    const out = [
      cmd("shape.insert", { preset: "roundRect", rect: [x, top, width, height], text: label }),
      // Step text is white by default, so the fill must be dark enough for it.
      cmd("shape.fill", { color: accent ? THEME.colors.accent1 : THEME.colors.dk2 }),
      cmd("shape.line", { none: true }),
      // Long Turkish words such as "Normalizasyon" must fit the box without breaking mid-word.
      cmd("format.size", { size: TYPE.flow }),
    ];
    if (i < count - 1) {
      out.push(
        cmd("shape.insert", {
          preset: "rightArrow",
          rect: [x + width + 8, top + height / 2 - 10, gap - 16, 20],
        }),
      );
      out.push(cmd("shape.fill", { color: THEME.colors.accent4 }));
      out.push(cmd("shape.line", { none: true }));
    }
    return out;
  });
}

/**
 * Footer on every slide except the cover (`hideOnTitle`): the deck title on
 * the left, the slide number on the right.
 */
function footerCommands(deck: DeckSpec): string[] {
  return [
    cmd("design.headerFooter", {
      slideNumber: true,
      footer: true,
      footerText: deck.title,
      hideOnTitle: true,
      all: true,
    }),
  ];
}

/** The whole deck as stages: theme, one stage per slide, footer, then the blank first slide removed. */
export function planDeck(deck: DeckSpec): Stage[] {
  const stages: Stage[] = [
    { label: "new presentation", cmds: [cmd("file.new", {}), ...themeCommands()] },
  ];
  deck.slides.forEach((slide, i) => {
    // `file.new` leaves one empty slide at index 0, so the n-th spec slide is at index n.
    stages.push(...slideStages(slide, i + 1, deck.transition));
  });
  stages.push({
    label: "footer and remove empty first slide",
    cmds: [
      ...footerCommands(deck),
      cmd("slide.go", { index: 0 }),
      cmd("slide.delete", { index: 0 }),
    ],
  });
  return stages;
}

/** Runs the stages through `deckcraft-cli` and returns the path of the final `.deckcraft` file. */
export async function runStages(cli: string, stages: Stage[], workDir: string): Promise<string> {
  await mkdir(workDir, { recursive: true });
  let previous: string | undefined;
  for (const [n, stage] of stages.entries()) {
    const save = join(workDir, `stage-${n}.deckcraft`);
    const printed = await run(cli, stage.cmds, previous, save);
    previous = save;
    if (stage.after) {
      const follow = stage.after(printed);
      const next = join(workDir, `stage-${n}b.deckcraft`);
      await run(cli, follow, previous, next);
      previous = next;
    }
  }
  if (!previous) throw new Error("no stages");
  return previous;
}

/** One `deckcraft-cli run` call. Returns each printed `id → result` pair so later stages can use ids. */
async function run(
  cli: string,
  cmds: string[],
  input: string | undefined,
  save?: string,
): Promise<Map<string, unknown>> {
  const args = [
    "run",
    ...(input ? ["--in", input] : []),
    ...cmds.flatMap((c) => ["--cmd", c]),
    ...(save ? ["--save", save] : []),
    "--print",
  ];
  const proc = Bun.spawn([cli, ...args], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0)
    throw new Error(`deckcraft-cli failed (${code}): ${err.trim()}\ncommands: ${cmds.join("\n")}`);
  const printed = new Map<string, unknown>();
  for (const line of out.split("\n")) {
    const at = line.indexOf(" → ");
    if (at > 0) printed.set(line.slice(0, at), safeJson(line.slice(at + 3)));
  }
  return printed;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Exports the finished document: the .pptx, the slide PDF and one PNG per slide. */
export async function exportDeck(
  cli: string,
  input: string,
  outDir: string,
): Promise<{ pptx: string; pdf: string; pngs: string[] }> {
  const pptx = join(outDir, "slide.pptx");
  const pdf = join(outDir, "slide.pdf");
  const pngDir = join(outDir, ".png");
  await mkdir(pngDir, { recursive: true });
  await run(cli, [cmd("file.export", { path: pptx, format: "pptx" })], input);
  await run(cli, [cmd("file.export", { path: pdf, format: "pdf", layout: "slides" })], input);
  await run(
    cli,
    [cmd("file.export", { path: join(pngDir, "slide.png"), format: "png", all: true, scale: 2 })],
    input,
  );
  // DeckCraft names the files slide1.png, slide2.png, …; sort by number so slide 10 follows slide 9.
  const names = await Array.fromAsync(new Bun.Glob("slide*.png").scan(pngDir));
  const pngs = names.sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  return { pptx, pdf, pngs: pngs.map((name) => join(pngDir, name)) };
}
