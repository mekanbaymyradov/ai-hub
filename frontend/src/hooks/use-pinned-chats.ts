import { useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/context/auth";
import { parsePinned, pinnedKey, togglePin } from "@/lib/pinned-chats";

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

/** Return the pinned chat ids and a function that pins or unpins a chat. */
export function usePinnedChats(): [number[], (chatId: number) => void] {
  const { user } = useAuth();
  const key = pinnedKey(user?.id);
  // The raw string, which compares by value, so an unchanged list doesn't re-render.
  const raw = useSyncExternalStore(subscribe, () => read(key));
  const pinned = useMemo(() => parsePinned(raw), [raw]);

  const toggle = (chatId: number) => {
    try {
      localStorage.setItem(key, JSON.stringify(togglePin(parsePinned(read(key)), chatId)));
    } catch {
      // Unsaved: the list stays as it was.
    }
    listeners.forEach((listener) => listener());
  };

  return [pinned, toggle];
}
