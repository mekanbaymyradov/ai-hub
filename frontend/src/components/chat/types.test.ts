import { describe, expect, it } from "vitest";
import { replySteps, type ChatUIMessage } from "./types";

const reply = (parts: ChatUIMessage["parts"]): ChatUIMessage => ({
  id: "1",
  role: "assistant",
  parts,
});

describe("replySteps", () => {
  it("lists reasoning and tool calls in order, without the answer", () => {
    const steps = replySteps(
      reply([
        { type: "reasoning", text: "Check the weather first.", state: "done" },
        {
          type: "tool-get_weather",
          toolCallId: "1",
          state: "output-available",
          input: { city: "London" },
          output: {},
        },
        {
          type: "tool-search_web",
          toolCallId: "2",
          state: "input-available",
          input: { query: "museums open in London" },
        },
        { type: "text", text: "Here you go.", state: "done" },
      ])
    );

    expect(steps).toEqual([
      { tool: null, text: "Check the weather first.", running: false },
      { tool: "get_weather", text: "London", running: false },
      { tool: "search_web", text: "museums open in London", running: true },
    ]);
  });

  it("joins reasoning parts that follow each other", () => {
    const steps = replySteps(
      reply([
        { type: "reasoning", text: "First.", state: "done" },
        { type: "reasoning", text: "Second.", state: "streaming" },
      ])
    );

    expect(steps).toEqual([{ tool: null, text: "First.\n\nSecond.", running: true }]);
  });
});
