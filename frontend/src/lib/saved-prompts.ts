// Prompts a user saved to reuse, kept per user in this browser. Storage that
// throws leaves them unsaved; the defaults still show.

export interface SavedPrompt {
  id: string;
  title: string;
  text: string;
}

export const promptsKey = (userId: number | undefined) => `ai_hub_prompts:${userId ?? "anonymous"}`;

/** Return the saved list, or null when there is none yet or it can't be read, which shows the defaults. */
export function parsePrompts(raw: string | null): SavedPrompt[] | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    return value.filter(
      (item): item is SavedPrompt =>
        typeof item?.id === "string" && typeof item?.title === "string" && typeof item?.text === "string"
    );
  } catch {
    return null;
  }
}

/** Return what follows a "/" that starts a one-line composer, or null when it isn't a prompt search. */
export function slashQuery(input: string): string | null {
  const match = input.match(/^\/([^\n]*)$/);
  return match ? match[1] : null;
}

/** Return the prompts matching `query`, those whose title matches first. */
export function matchPrompts(prompts: SavedPrompt[], query: string): SavedPrompt[] {
  const q = query.trim().toLowerCase();
  if (!q) return prompts;
  const inTitle = prompts.filter((p) => p.title.toLowerCase().includes(q));
  const inText = prompts.filter((p) => !inTitle.includes(p) && p.text.toLowerCase().includes(q));
  return [...inTitle, ...inText];
}
