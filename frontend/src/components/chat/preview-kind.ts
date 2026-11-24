import { createContext } from "react";

export type PreviewKind = "diagram" | "svg" | "html";

// False while the reply streams: a half-written diagram or page would only fail or flicker.
export const PreviewsReady = createContext(true);

const SVG_START = /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i;

/** Return how a code block can be shown besides its code, or null when it can't. */
export function previewKind(language: string | undefined, code: string): PreviewKind | null {
  const lang = language?.toLowerCase();
  if (lang === "mermaid") return "diagram";
  // Models label SVG as svg, xml or nothing at all.
  if (lang === "svg" || ((lang === undefined || lang === "xml") && SVG_START.test(code))) return "svg";
  if (lang === "html" || lang === "htm") return "html";
  return null;
}

/**
 * Return SVG code as a data URL for an <img>, which never runs the scripts an SVG can hold.
 *
 * An <img> also shows nothing without the SVG namespace, which models often leave out, so it is added.
 * An SVG with a viewBox but no size gets the viewBox's size, as browsers would stretch it to fill the width.
 */
export function svgDataUrl(code: string): string {
  const tag = code.match(/<svg[^>]*>/i)?.[0] ?? "";
  let attributes = "";
  if (!/\sxmlns=/i.test(tag)) attributes += ' xmlns="http://www.w3.org/2000/svg"';
  const viewBox = tag.match(/\sviewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (viewBox && !/\swidth=/i.test(tag) && !/\sheight=/i.test(tag)) {
    attributes += ` width="${viewBox[1]}" height="${viewBox[2]}"`;
  }
  const svg = attributes ? code.replace(/<svg/i, `<svg${attributes}`) : code;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
