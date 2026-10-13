/**
 * Deck data → DeckCraft commands → .pptx and slide PDF / PNG exports.
 *
 * DeckCraft's CLI runs one command list per process and does not keep state
 * between calls, so the deck is built in stages: each stage loads the previous
 * `.deckcraft` file (`--in`), runs its commands and saves the next one
 * (`--save`). Every stage starts with `slide.go`, because commands act on the
 * selected slide. Table cells need the table's id, which only exists after
 * `insert.table` has run, so a table takes two stages.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { DeckSpec, SlideSpec } from "../deck/types";

/** Colours and fonts: one ink colour, one accent, one font family. See `design/` notes in the skill. */
export const THEME = {
  colors: {
    dk1: "#1B2430", // text on light
    lt1: "#FFFFFF", // background
    dk2: "#3D4B5C", // secondary text
    lt2: "#F4F5F7", // quiet panels
    accent1: "#1F5FAD", // the one accent: the outcome and the emphasis
    accent2: "#D9822B",
    accent3: "#6B7A8F",
    accent4: "#A3ADBB",
    accent5: "#2E7D5B",
    accent6: "#8E44AD",
  },
  font: "Inter",
} as const;

/** A DeckCraft slide is 960 × 540 pt (16:9). Coordinates below are in points. */
const SLIDE = { width: 960, height: 540 };
const MARGIN_X = 60;

/** One call to `deckcraft-cli run`. `after` builds the commands that need the previous stage's output. */
export interface Stage {
  /** Name shown in logs. */
  label: string;
  cmds: string[];
  /** Commands that need an id printed by this stage (e.g. a table id). */
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

/**
 * Stages for one slide. The slide is appended at the end of the deck, so its
 * index is `index`; every `slide.new` is followed by `slide.go` so the commands
 * after it act on that slide.
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
            ...fade,
          ],
        },
      ];

    case "bullets": {
      const body = [
        text(slide.lead),
        text(slide.pointsLabel),
        ...(Array.isArray(slide.points) ? slide.points.map(text) : []),
      ]
        .filter((line) => line.length > 0)
        .join("\n");
      return [
        {
          label: `${slide.id}: bullets`,
          cmds: [
            cmd("slide.new", { layout: "titleAndContent", title: text(slide.title), body }),
            ...fade,
          ],
        },
      ];
    }

    case "flow":
      return [
        {
          label: `${slide.id}: flow`,
          cmds: [
            cmd("slide.new", { layout: "titleOnly", title: text(slide.title) }),
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
            cmd("insert.table", { rows: rowCount, cols: columns.length, rect: tableRect }),
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
            ...fade,
          ],
        },
      ];

    default:
      throw new Error(`${slide.id}: no DeckCraft mapping for layout "${slide.layout}"`);
  }
}

/** Process steps: rounded boxes joined by small arrows, the last step in the accent colour. */
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
      // Step text is white by default, so plain steps use the dark secondary colour, not a light panel.
      cmd("shape.fill", { color: accent ? THEME.colors.accent1 : THEME.colors.dk2 }),
      cmd("shape.line", { none: true }),
      // Long Turkish words such as "Normalizasyon" must fit the box without breaking mid-word.
      cmd("format.size", { size: 14 }),
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

/** The whole deck as stages: theme, one stage per slide, then the blank first slide removed. */
export function planDeck(deck: DeckSpec): Stage[] {
  const stages: Stage[] = [
    { label: "new presentation", cmds: [cmd("file.new", {}), ...themeCommands()] },
  ];
  deck.slides.forEach((slide, i) => {
    // `file.new` leaves one empty slide at index 0, so the n-th spec slide is at index n.
    stages.push(...slideStages(slide, i + 1, deck.transition));
  });
  stages.push({
    label: "remove empty first slide",
    cmds: [cmd("slide.go", { index: 0 }), cmd("slide.delete", { index: 0 })],
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
