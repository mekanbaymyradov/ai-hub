import { useState, type FormEvent } from "react";
import { Bookmark, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSavedPrompts } from "@/hooks/use-saved-prompts";
import { type SavedPrompt } from "@/lib/saved-prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalDescription, ModalTitle } from "@/components/Modal";

const TITLE_MAX_LENGTH = 60;
const TEXT_MAX_LENGTH = 4000;

// 16px on phones, since iOS zooms into any focused field smaller than that.
const FIELD = "rounded-xl border-line-1 bg-field text-base text-fg-1 sm:text-sm dark:bg-field";

export function PromptsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [prompts, save] = useSavedPrompts();
  // The prompt being edited, "new" while adding one, or null.
  const [editing, setEditing] = useState<SavedPrompt | "new" | null>(null);

  const handleSave = (title: string, text: string) => {
    if (editing === "new") {
      save([...prompts, { id: crypto.randomUUID(), title, text }]);
    } else if (editing) {
      save(prompts.map((p) => (p.id === editing.id ? { ...p, title, text } : p)));
    }
    setEditing(null);
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/60 dark:text-blue-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div>
            <ModalTitle className="text-base font-semibold text-fg-1">{t("prompts.title")}</ModalTitle>
            <ModalDescription className="text-xs text-fg-7">{t("prompts.description")}</ModalDescription>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="cursor-pointer rounded-lg p-1.5 text-fg-7 transition-colors hover:bg-fill-1 hover:text-fg-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {prompts.length > 0 ? (
        <ul className="max-h-72 divide-y divide-line-1 overflow-y-auto rounded-xl border border-line-1">
          {prompts.map((prompt) => (
            <li key={prompt.id} className="flex items-start gap-2 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-2">{prompt.title}</p>
                <p className="line-clamp-2 text-xs text-fg-7">{prompt.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(prompt)}
                aria-label={t("prompts.edit", { title: prompt.title })}
                className="cursor-pointer rounded-lg p-1.5 text-fg-7 hover:bg-fill-1 hover:text-fg-1 pointer-coarse:p-2.5"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => save(prompts.filter((p) => p.id !== prompt.id))}
                aria-label={t("prompts.delete", { title: prompt.title })}
                className="cursor-pointer rounded-lg p-1.5 text-fg-7 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 pointer-coarse:p-2.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line-1 px-4 py-6 text-center text-sm text-fg-7">
          {t("prompts.empty")}
        </p>
      )}

      {editing ? (
        <PromptForm
          // A new key per prompt, so the fields start from the prompt being edited.
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditing("new")}
          className="h-9 w-full cursor-pointer gap-1.5 rounded-xl text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("prompts.add")}
        </Button>
      )}
    </Modal>
  );
}

function PromptForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: SavedPrompt;
  onSave: (title: string, text: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [text, setText] = useState(initial?.text ?? "");
  const canSave = title.trim() !== "" && text.trim() !== "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canSave) onSave(title.trim(), text.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 rounded-xl border border-line-1 p-3">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        placeholder={t("prompts.titlePlaceholder")}
        aria-label={t("prompts.titlePlaceholder")}
        className={`h-9 ${FIELD}`}
      />
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={TEXT_MAX_LENGTH}
        rows={4}
        placeholder={t("prompts.textPlaceholder")}
        aria-label={t("prompts.textPlaceholder")}
        className={`min-h-24 resize-none ${FIELD}`}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-8 cursor-pointer rounded-lg px-3 text-xs text-fg-5">
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={!canSave} className="h-8 cursor-pointer rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500">
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
