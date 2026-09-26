import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ReactNode } from "react";
import { type ImagesInput, render } from "takumi-pdf";
import { PageNumber, TotalPages } from "takumi-pdf/primitives";
import { FONT_FAMILY, loadFonts } from "./fonts";
import { docTheme as t } from "./theme";

export interface PdfOptions {
  /** PDF title (metadata + viewer tab). */
  title: string;
  /** Left side of the running footer; defaults to `title`. */
  footerLabel?: string;
  authors?: string[];
  description?: string;
  /** BCP-47 language; drives text shaping and PDF metadata. Default `tr-TR`. */
  lang?: string;
  /** Landscape A4 instead of portrait. */
  landscape?: boolean;
  /** Skip the page-number footer on page 1 (a title page). Default `true`. */
  titlePage?: boolean;
  /**
   * Image bytes for `<img src>` in the tree, e.g. `[{ src: "slide-3.png", data }]`.
   * takumi-pdf never fetches or reads files itself.
   */
  images?: ImagesInput;
}

function Footer({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        padding: "0 38px",
        fontFamily: FONT_FAMILY,
        fontSize: t.size.small,
        color: t.colors.textMuted,
      }}
    >
      <span>{label}</span>
      <span>
        <PageNumber /> / <TotalPages />
      </span>
    </div>
  );
}

/**
 * JSX → PDF bytes via takumi-pdf (Takumi's layout engine compiled to wasm, no
 * browser). Output is vector with selectable text and a bookmark outline built
 * from `h1`–`h6`, on A4 with a running footer.
 */
export async function renderPdf(node: ReactNode, options: PdfOptions): Promise<Uint8Array> {
  const { title, footerLabel = title, lang = "tr-TR", titlePage = true } = options;
  return render(node, {
    size: "a4",
    landscape: options.landscape ?? false,
    margin: { top: 56, right: 64, bottom: "auto", left: 64 },
    fonts: await loadFonts(),
    ...(options.images ? { images: options.images } : {}),
    lang,
    outline: true,
    backgroundColor: "#FFFFFF",
    footer: <Footer label={footerLabel} />,
    pages: titlePage ? { first: { footer: false } } : {},
    metadata: {
      title,
      ...(options.description ? { description: options.description } : {}),
      ...(options.authors ? { authors: options.authors } : {}),
      creator: "human-activity-recognition (takumi-pdf)",
    },
  });
}

/** `renderPdf` and write the bytes to `path` (parent directories are created). */
export async function writePdf(
  path: string,
  node: ReactNode,
  options: PdfOptions,
): Promise<number> {
  const bytes = await renderPdf(node, options);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  return bytes.byteLength;
}
