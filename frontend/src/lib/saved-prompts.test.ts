import { describe, expect, it } from "vitest";
import { matchPrompts, parsePrompts, slashQuery, type SavedPrompt } from "./saved-prompts";

const prompt = (id: string, title: string, text: string): SavedPrompt => ({ id, title, text });

describe("slashQuery", () => {
  it("reads what follows a leading slash", () => {
    expect(slashQuery("/")).toBe("");
    expect(slashQuery("/code rev")).toBe("code rev");
  });

  it("ignores text that isn't a prompt search", () => {
    expect(slashQuery("hello /code")).toBeNull();
    expect(slashQuery("/first line\nsecond")).toBeNull();
    expect(slashQuery("")).toBeNull();
  });
});

describe("matchPrompts", () => {
  const prompts = [
    prompt("1", "Summarize", "Give me the key points"),
    prompt("2", "Review code", "Look for bugs and summarize them"),
    prompt("3", "Translate", "Translate to Russian"),
  ];

  it("returns every prompt for an empty search", () => {
    expect(matchPrompts(prompts, " ")).toEqual(prompts);
  });

  it("puts title matches before text matches, ignoring case", () => {
    expect(matchPrompts(prompts, "SUMMAR").map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(matchPrompts(prompts, "poem")).toEqual([]);
  });
});

describe("parsePrompts", () => {
  it("reads a saved list and drops malformed entries", () => {
    const raw = JSON.stringify([prompt("1", "A", "a"), { id: 2, title: "B" }, null]);
    expect(parsePrompts(raw)).toEqual([prompt("1", "A", "a")]);
  });

  it("keeps an empty list, which is the user's choice", () => {
    expect(parsePrompts("[]")).toEqual([]);
  });

  it("returns null for nothing saved or unreadable data, which shows the defaults", () => {
    expect(parsePrompts(null)).toBeNull();
    expect(parsePrompts("{oops")).toBeNull();
    expect(parsePrompts('{"a":1}')).toBeNull();
  });
});
