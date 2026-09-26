/**
 * @har/report/pdf — the shared JSX → PDF converter (takumi-pdf). Used by the
 * reports in `report/` and by the presenter guides in `slide-directions/`.
 */
export * from "./components";
export { FONT_FAMILY, loadFonts, MONO_FAMILY } from "./fonts";
export { type PdfOptions, renderPdf, writePdf } from "./render";
export { type DocTheme, docTheme } from "./theme";
