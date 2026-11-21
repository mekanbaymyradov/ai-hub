import { Keyboard, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Modal, ModalDescription, ModalTitle } from "@/components/Modal";
import { SHORTCUTS } from "@/lib/shortcuts";

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} className="max-w-md space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/60 dark:text-blue-400">
            <Keyboard className="h-4 w-4" />
          </span>
          <div>
            <ModalTitle className="text-base font-semibold text-fg-1">{t("shortcuts.title")}</ModalTitle>
            <ModalDescription className="text-xs text-fg-7">{t("shortcuts.description")}</ModalDescription>
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

      <dl className="divide-y divide-line-1 rounded-xl border border-line-1">
        {SHORTCUTS.map(({ keys, label }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-3.5 py-2.5">
            <dt className="text-sm text-fg-3">{t(`shortcuts.${label}`)}</dt>
            <dd className="flex shrink-0 items-center gap-1">
              {keys.map((key) => (
                <kbd
                  key={key}
                  className="min-w-6 rounded-md border border-line-1 bg-fill-1 px-1.5 py-0.5 text-center font-mono text-[11px] font-medium text-fg-4 shadow-xs"
                >
                  {key}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
