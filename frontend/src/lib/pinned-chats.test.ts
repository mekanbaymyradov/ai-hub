import { describe, expect, it } from "vitest";
import { parsePinned, pinnedFirst, togglePin } from "./pinned-chats";

describe("parsePinned", () => {
  it("reads saved ids", () => {
    expect(parsePinned("[3,1]")).toEqual([3, 1]);
  });

  it("ignores missing, broken or hand-edited values", () => {
    expect(parsePinned(null)).toEqual([]);
    expect(parsePinned("{oops")).toEqual([]);
    expect(parsePinned('{"a":1}')).toEqual([]);
    expect(parsePinned('[1,"2",null,2.5,4]')).toEqual([1, 4]);
  });
});

describe("togglePin", () => {
  it("puts a new pin first and removes an existing one", () => {
    expect(togglePin([1, 2], 3)).toEqual([3, 1, 2]);
    expect(togglePin([3, 1, 2], 1)).toEqual([3, 2]);
  });
});

describe("pinnedFirst", () => {
  const chats = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  it("moves pinned chats to the top in pin order", () => {
    expect(pinnedFirst(chats, [3, 1]).map((c) => c.id)).toEqual([3, 1, 2, 4]);
  });

  it("skips pins whose chat isn't in the list", () => {
    expect(pinnedFirst(chats, [9, 2]).map((c) => c.id)).toEqual([2, 1, 3, 4]);
  });
});
