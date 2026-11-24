import { memo, useCallback, useContext, useState, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { Check, Copy, Play, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Element, ElementContent } from "hast";
import type { Nodes, Root } from "mdast";
import "katex/dist/katex.min.css";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";
import { normalizeMath } from "./normalize-math";
import { HtmlPreview, MermaidDiagram, SvgImage } from "./CodePreview";
import { previewKind, PreviewsReady } from "./preview-kind";

interface FormattedMessageProps {
  content: string;
  isStreaming?: boolean;
}

// Show raw HTML as the text it is. Rendering it would let a reply inject
// markup, and react-markdown's default drops it, losing text like Vec<String>.
function remarkHtmlAsText() {
  return (tree: Root) => {
    const walk = (node: Nodes) => {
      if (node.type === "html") Object.assign(node, { type: "text" });
      if ("children" in node) node.children.forEach(walk);
    };
    walk(tree);
  };
}

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  return "children" in node ? node.children.map(textOf).join("") : "";
}

function CodeBlock({ node, children }: { node?: Element; children?: ReactNode }) {
  const [copyState, copy] = useCopy();
  const { t } = useTranslation();

  const code = node?.children.find((child): child is Element => child.type === "element");
  const language = (code?.properties.className as string[] | undefined)
    ?.find((name) => name.startsWith("language-"))
    ?.slice("language-".length);

  // The parser ends every code block with a newline the model didn't write.
  const raw = code ? textOf(code).replace(/\n$/, "") : "";
  const handleCopy = () => {
    void copy(raw);
  };

  const ready = useContext(PreviewsReady);
  const kind = ready ? previewKind(language, raw) : null;
  const [view, setView] = useState<"visual" | "code">("visual");
  const [failed, setFailed] = useState(false);
  const [htmlOpen, setHtmlOpen] = useState(false);
  const handleFailed = useCallback(() => setFailed(true), []);
  const canDraw = (kind === "diagram" || kind === "svg") && !failed;
  const showVisual = canDraw && view === "visual";

  return (
    // overflow-clip, not hidden: hidden makes this a scroll container and the
    // sticky header would stop following the chat's scroll.
    <div className="relative my-3.5 w-full max-w-full rounded-xl overflow-clip border border-line-2 bg-code shadow-xs dark:shadow-md">
      {/* No z-index: one would lift the header above the composer, which overlays the bottom of the list. */}
      <div className="sticky top-0 flex items-center justify-between px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-line-2 select-none">
        <span className="font-mono text-xs font-semibold text-fg-2">{language ?? "code"}</span>
        <div className="flex items-center gap-1.5">
        {canDraw && (
          <div role="group" className="flex rounded-md bg-zinc-200/70 p-0.5 dark:bg-white/5">
            {(["visual", "code"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  "cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition-colors pointer-coarse:py-2",
                  view === option ? "bg-white text-fg-1 shadow-xs dark:bg-white/15" : "text-fg-6 hover:text-fg-1"
                )}
              >
                {option === "visual" ? t("preview.diagram") : t("preview.code")}
              </button>
            ))}
          </div>
        )}
        {kind === "html" && (
          <button
            type="button"
            onClick={() => setHtmlOpen(true)}
            className="flex cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-500 pointer-coarse:py-2"
          >
            <Play className="h-3 w-3" />
            {t("preview.open")}
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center size-7 pointer-coarse:size-10 rounded-md text-fg-6 hover:bg-zinc-200 hover:text-fg-1 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={copyState === "copied" ? t("message.codeCopied") : copyState === "failed" ? t("message.copyFailed") : t("message.copyCode")}
          aria-label={t("message.copyCode")}
        >
          {copyState === "copied" ? (
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : copyState === "failed" ? (
            <X className="h-4 w-4 text-red-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        </div>
      </div>
      {failed && (kind === "diagram" || kind === "svg") && (
        <p className="border-b border-line-2 px-3.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">{t("preview.drawFailed")}</p>
      )}
      {showVisual && (
        <div className="bg-white dark:bg-zinc-950">
          {kind === "diagram" ? <MermaidDiagram code={raw} onError={handleFailed} /> : <SvgImage code={raw} onError={handleFailed} />}
        </div>
      )}
      {kind === "html" && <HtmlPreview code={raw} open={htmlOpen} onOpenChange={setHtmlOpen} />}
      {!showVisual && (
      <pre className="p-3.5 w-full max-w-full overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-fg-3 selection:bg-blue-200 dark:selection:bg-blue-600/40">
        {children}
      </pre>
      )}
    </div>
  );
}

const TEXT = "leading-relaxed text-[14px] sm:text-[15px] text-fg-3 break-words [overflow-wrap:anywhere]";

const components: Components = {
  pre: CodeBlock,
  p: ({ children }) => <p className={`my-1.5 ${TEXT}`}>{children}</p>,
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-fg-1 mt-4 mb-2 first:mt-0 tracking-tight break-words [overflow-wrap:anywhere]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-fg-1 mt-3.5 mb-1.5 first:mt-0 tracking-tight break-words [overflow-wrap:anywhere]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mt-3 mb-1 first:mt-0 tracking-tight break-words [overflow-wrap:anywhere]">
      {children}
    </h3>
  ),
  h4: ({ children }) => <h4 className="text-sm font-semibold text-fg-2 mt-3 mb-1">{children}</h4>,
  ul: ({ children }) => (
    <ul className="my-2.5 space-y-1.5 pl-5 list-disc marker:text-zinc-400 dark:marker:text-zinc-500">
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol start={start} className="my-2.5 space-y-1.5 pl-6 list-decimal marker:font-mono marker:text-xs marker:font-medium marker:text-fg-7">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className={`pl-1 [&>p]:my-0 [&>ul]:my-1.5 [&>ol]:my-1.5 ${TEXT}`}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 pl-3.5 py-1.5 my-2 rounded-r-md text-fg-4 italic [&>p]:my-0.5 [&_p]:text-fg-4">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3.5 border-line-2" />,
  a: ({ href, children }) => (
    <a
      // react-markdown blanks unsafe URLs such as javascript:, and an empty
      // href would open this page.
      href={href || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 transition-colors font-medium break-all"
    >
      {children}
    </a>
  ),
  // A link instead of the image: loading any URL a reply names would let it
  // send data to that server the moment the message renders.
  img: ({ src, alt }) => (
    <a href={typeof src === "string" ? src : undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 break-all">
      {alt || src}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fg-1">{children}</strong>,
  em: ({ children }) => <em className="italic text-zinc-700 dark:text-zinc-200">{children}</em>,
  del: ({ children }) => <del className="line-through text-zinc-500">{children}</del>,
  table: ({ children }) => (
    <div className="my-3 w-full max-w-full overflow-x-auto rounded-xl border border-line-2 bg-zinc-50/50 dark:bg-white/[0.02]">
      <table className="w-full min-w-full text-xs text-left border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-line-2 text-fg-2 font-medium">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-300">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="hover:bg-zinc-100/60 dark:hover:bg-white/[0.02] transition-colors">{children}</tr>,
  th: ({ children, style }) => <th style={style} className="px-3.5 py-2">{children}</th>,
  td: ({ children, style }) => <td style={style} className="px-3.5 py-2">{children}</td>,
};

const remarkPlugins = [remarkGfm, remarkMath, remarkHtmlAsText];
const rehypePlugins = [rehypeKatex, rehypeHighlight];

const MarkdownBlock = memo(function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {markdown}
    </Markdown>
  );
});

// Same syntax as the render, so a block ends where react-markdown ends it.
const blockParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

function splitBlocks(markdown: string): string[] {
  const starts = blockParser.parse(markdown).children.map((node) => node.position?.start.offset ?? 0);
  return starts.map((start, index) => markdown.slice(start, starts[index + 1]));
}

export function FormattedMessage({ content, isStreaming }: FormattedMessageProps) {
  if (!content) return null;

  const markdown = normalizeMath(content);

  return (
    <PreviewsReady.Provider value={!isStreaming}>
    <div className="formatted-message w-full min-w-0 max-w-full overflow-clip">
      {/* While a reply streams only its last block changes, so blocks render
          apart and the finished ones are skipped. A done reply renders whole,
          since footnotes and link definitions can point across blocks. */}
      {isStreaming ? (
        splitBlocks(markdown).map((block, index) => <MarkdownBlock key={index} markdown={block} />)
      ) : (
        <MarkdownBlock markdown={markdown} />
      )}

      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 ml-1 align-baseline bg-blue-400/90 rounded-xs animate-pulse" />
      )}
    </div>
    </PreviewsReady.Provider>
  );
}
