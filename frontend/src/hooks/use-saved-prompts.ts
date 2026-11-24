import { useMemo, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/auth";
import { parsePrompts, promptsKey, type SavedPrompt } from "@/lib/saved-prompts";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab's change arrives as a storage event.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const DEFAULTS = ["review", "explain", "summarize", "improve"] as const;

/**
 * Return the user's saved prompts and a function that replaces them.
 *
 * Until the user saves a change they get starter prompts, in the interface's language.
 */
export function useSavedPrompts(): [SavedPrompt[], (prompts: SavedPrompt[]) => void] {
  const { user } = useAuth();
  const { t } = useTranslation();
  const key = promptsKey(user?.id);
  // The raw string, which compares by value, so an unchanged list doesn't re-render.
  const raw = useSyncExternalStore(subscribe, () => read(key));

  const prompts = useMemo(
    () =>
      parsePrompts(raw) ??
      DEFAULTS.map((name) => ({
        id: `default-${name}`,
        title: t(`prompts.defaults.${name}.title`),
        text: t(`prompts.defaults.${name}.text`),
      })),
    [raw, t]
  );

  const save = (next: SavedPrompt[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Unsaved: the list stays as it was.
    }
    listeners.forEach((listener) => listener());
  };

  return [prompts, save];
}
