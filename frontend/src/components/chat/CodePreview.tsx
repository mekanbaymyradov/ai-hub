import { useEffect, useId, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { svgDataUrl } from "./preview-kind";

// Mermaid is large, so it loads only once a reply holds a diagram.
let mermaidModule: Promise<typeof import("mermaid")> | null = null;
// Renders run one at a time: mermaid keeps global state while it draws.
let renderQueue: Promise<void> = Promise.resolve();

/** Draw Mermaid code, calling `onError` when it isn't a diagram mermaid can draw. */
export function MermaidDiagram({ code, onError }: { code: string; onError: () => void }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // A valid element id: useId's colons aren't.
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const job = renderQueue.then(async () => {
      const { default: mermaid } = await (mermaidModule ??= import("mermaid"));
      mermaid.initialize({
        startOnLoad: false,
        // Sanitizes labels and drops scripts and click handlers from the drawing.
        securityLevel: "strict",
        theme: theme === "dark" ? "dark" : "default",
        fontFamily: "Geist Variable, sans-serif",
      });
      try {
        // Parsed first, so a bad diagram fails here instead of leaving mermaid's error drawing in the page.
        await mermaid.parse(code);
        const result = await mermaid.render(id, code);
        if (!cancelled) setSvg(result.svg);
      } catch {
        if (!cancelled) onError();
      }
    });
    renderQueue = job.catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, theme, id, onError]);

  if (svg === null) {
    return (
      <div role="status" className="flex items-center justify-center gap-2 py-10 text-xs text-fg-7">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("preview.drawing")}
      </div>
    );
  }
  return (
    <div
      className="flex justify-center overflow-x-auto p-4 [&_svg]:h-auto [&_svg]:max-w-full"
      // Mermaid's strict mode has already sanitized this SVG.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function SvgImage({ code, onError }: { code: string; onError: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center p-4">
      {/* Capped, as an SVG with only a viewBox would otherwise stretch to the full width. */}
      <img src={svgDataUrl(code)} alt={t("preview.svgAlt")} onError={onError} className="h-auto max-h-72 w-auto max-w-full object-contain" />
    </div>
  );
}

/** Run HTML from a reply in a side panel, sandboxed so it can't reach the app or the user's account. */
export function HtmlPreview({ code, open, onOpenChange }: { code: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  // A new key remounts the frame, which runs the page again from the start.
  const [run, setRun] = useState(0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
      >
        <SheetHeader className="flex-row items-center gap-3 border-b border-line-1 py-3 pr-14 pl-4">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-sm">{t("preview.title")}</SheetTitle>
            <SheetDescription className="text-xs text-fg-7">{t("preview.sandboxNote")}</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setRun((n) => n + 1)} aria-label={t("preview.reload")} title={t("preview.reload")}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <iframe
          key={run}
          title={t("preview.title")}
          srcDoc={code}
          // Scripts run, but without allow-same-origin the page has an origin of its own:
          // it can't read this app's storage or cookies, call its API, or navigate it.
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="w-full flex-1 bg-white"
        />
      </SheetContent>
    </Sheet>
  );
}
