export const IS_MAC = /Mac|iPhone|iPad/.test(navigator.userAgent);

const MOD = IS_MAC ? "⌘" : "Ctrl";
const SHIFT = IS_MAC ? "⇧" : "Shift";

// The new-chat shortcut as each platform writes it; the handler is in the chat page.
// Unspaced, so the hint fits beside "New thread" in the sidebar.
export const NEW_CHAT_KEYS = IS_MAC ? "⌘⇧O" : "Ctrl+Shift+O";

// The chat search shortcut; the handler is in the sidebar.
export const SEARCH_KEYS = IS_MAC ? "⌘K" : "Ctrl+K";

// Every shortcut, for the help dialog; each label is under shortcuts.<label> in the translations.
export const SHORTCUTS = [
  { keys: [MOD, "K"], label: "search" },
  { keys: [MOD, SHIFT, "O"], label: "newChat" },
  { keys: [MOD, "B"], label: "toggleSidebar" },
  { keys: ["Enter"], label: "send" },
  { keys: [SHIFT, "Enter"], label: "newLine" },
  { keys: ["↑"], label: "lastPrompt" },
  { keys: ["Esc"], label: "stop" },
  { keys: [MOD, "/"], label: "help" },
] as const;
