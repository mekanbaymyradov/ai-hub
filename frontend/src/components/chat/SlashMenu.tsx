import { Bookmark, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { type SavedPrompt } from "@/lib/saved-prompts";

interface SlashMenuProps {
  // The listbox's id, which the composer points at with aria-controls; options are <id>-<index>.
  id: string;
  prompts: SavedPrompt[];
  active: number;
  onPick: (prompt: SavedPrompt) => void;
  onHover: (index: number) => void;
  onManage: () => void;
}

/** The saved prompts matching what follows a "/" in the composer; the composer handles the keys. */
export function SlashMenu({ id, prompts, active, onPick, onHover, onManage }: SlashMenuProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-2xl border border-line-1 bg-overlay shadow-2xl">
      {prompts.length > 0 ? (
        <ul id={id} role="listbox" aria-label={t("prompts.title")} className="max-h-64 overflow-y-auto p-1.5">
          {prompts.map((prompt, index) => (
            <li
              key={prompt.id}
              id={`${id}-${index}`}
              role="option"
              aria-selected={index === active}
              // Down, not click, and default prevented, so the composer keeps focus.
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(prompt);
              }}
              onMouseEnter={() => onHover(index)}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2",
                index === active ? "bg-fill-1" : "hover:bg-fill-1"
              )}
            >
              <Bookmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-fg-2">{prompt.title}</span>
                <span className="block truncate text-xs text-fg-7">{prompt.text}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p id={id} className="px-4 py-3 text-sm text-fg-7">
          {t("prompts.noMatch")}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-line-1 px-3 py-1.5 text-[11px] text-fg-7">
        <span className="hidden truncate sm:inline">{t("prompts.menuHint")}</span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onManage();
          }}
          className="ml-auto flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 font-medium text-blue-600 hover:bg-fill-1 dark:text-blue-400 pointer-coarse:py-2"
        >
          <Settings2 className="h-3 w-3" />
          {t("prompts.manage")}
        </button>
      </div>
    </div>
  );
}
