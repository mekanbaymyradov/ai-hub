// Chats a user pinned to the top of the sidebar, kept per user in this browser,
// newest pin first. A deleted chat's id stays behind harmlessly: no row matches it.

export const pinnedKey = (userId: number | undefined) => `ai_hub_pinned_chats:${userId ?? "anonymous"}`;

/** Return the pinned ids, or none when nothing is saved or it can't be read. */
export function parsePinned(raw: string | null): number[] {
  if (raw === null) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export function togglePin(pinned: number[], chatId: number): number[] {
  return pinned.includes(chatId) ? pinned.filter((id) => id !== chatId) : [chatId, ...pinned];
}

/** Return the pinned chats in pin order, then the rest in their own order. */
export function pinnedFirst<T extends { id: number }>(chats: T[], pinned: number[]): T[] {
  const byId = new Map(chats.map((chat) => [chat.id, chat]));
  const top = pinned.flatMap((id) => byId.get(id) ?? []);
  return [...top, ...chats.filter((chat) => !pinned.includes(chat.id))];
}
