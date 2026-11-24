import { describe, expect, it } from "vitest";
import { previewKind, svgDataUrl } from "./preview-kind";

describe("previewKind", () => {
  it("draws mermaid as a diagram", () => {
    expect(previewKind("mermaid", "graph TD; A-->B")).toBe("diagram");
  });

  it("shows SVG whether it's labelled svg, xml or not at all", () => {
    const svg = '<svg viewBox="0 0 10 10"><circle r="5"/></svg>';
    expect(previewKind("svg", svg)).toBe("svg");
    expect(previewKind("xml", `<?xml version="1.0"?>\n${svg}`)).toBe("svg");
    expect(previewKind(undefined, `<!-- a dot -->\n${svg}`)).toBe("svg");
  });

  it("previews HTML", () => {
    expect(previewKind("html", "<h1>Hi</h1>")).toBe("html");
  });

  it("leaves other code alone", () => {
    expect(previewKind("python", "print('<svg>')")).toBeNull();
    expect(previewKind("xml", "<note>hi</note>")).toBeNull();
    expect(previewKind(undefined, "plain text")).toBeNull();
  });
});

describe("svgDataUrl", () => {
  const decode = (url: string) => decodeURIComponent(url.slice(url.indexOf(",") + 1));

  it("adds the SVG namespace an <img> needs", () => {
    expect(decode(svgDataUrl('<svg width="10" height="10"></svg>'))).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'
    );
  });

  it("keeps a namespace that's already there", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    expect(decode(svgDataUrl(svg))).toBe(svg);
  });

  it("sizes an SVG that only has a viewBox to that viewBox", () => {
    expect(decode(svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"></svg>'))).toBe(
      '<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"></svg>'
    );
  });

  it("keeps a size that's already set", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 120 40"></svg>';
    expect(decode(svgDataUrl(svg))).toBe(svg);
  });
});
