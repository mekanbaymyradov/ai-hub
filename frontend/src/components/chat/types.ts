import {
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage as AIUIMessage,
} from "ai";
import { type AttachmentPublic, type Effort, type MessagePublic, type ModelPublic, type ChatPublic } from "@/api/types";

export interface ChatMessageMetadata {
  attachments?: AttachmentPublic[];
  modelId?: string | null;
}

export type ChatDataParts = {
  "chat-name": { name: string };
};

export type ChatUIMessage = AIUIMessage<ChatMessageMetadata, ChatDataParts>;

export interface SendRequestMetadata {
  chatId: number | null;
  modelId: string;
  attachmentIds: number[];
  effort: Effort | null;
  models: ModelPublic[];
  onChatCreated?: (chat: ChatPublic) => void;
}

/** One step the model took toward its reply: reasoning, or a tool call. */
export interface ReplyStep {
  /** The tool's name, or null for reasoning. */
  tool: string | null;
  /** The reasoning, or the tool's input, like a city or a search query. */
  text: string;
  running: boolean;
}

export interface UIMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  /** The reply's reasoning and tool calls, in the order they happened. */
  steps?: ReplyStep[];
  // Why the reply stopped early; shown under whatever content arrived.
  error?: string;
  // The failed request's trace ID, which the user quotes to support.
  errorId?: string;
  attachments?: AttachmentPublic[];
  /** Model id that generated this response, if available. */
  modelId?: string | null;
}

/** Convert a stored API message into a Vercel AI SDK ChatUIMessage. */
export function messagePublicToChatUIMessage(msg: MessagePublic): ChatUIMessage {
  return {
    id: msg.id.toString(),
    role: msg.kind === "response" ? "assistant" : "user",
    parts: [{ type: "text", text: msg.content, state: "done" }],
    metadata: {
      attachments: msg.attachments ?? [],
      modelId: msg.model_id,
    },
  };
}

// The input's text values, like the city or the search query.
function toolInputText(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  return Object.values(input)
    .flat()
    .filter((value): value is string => typeof value === "string")
    .join(", ");
}

/** Return the reply's reasoning and tool calls, joining reasoning parts that follow each other. */
export function replySteps(msg: ChatUIMessage): ReplyStep[] {
  const steps: ReplyStep[] = [];
  for (const part of msg.parts) {
    if (isReasoningUIPart(part) && part.text) {
      const last = steps.at(-1);
      if (last && last.tool === null) {
        last.text += `\n\n${part.text}`;
        last.running = part.state === "streaming";
      } else {
        steps.push({ tool: null, text: part.text, running: part.state === "streaming" });
      }
    } else if (isToolUIPart(part)) {
      steps.push({
        tool: getToolName(part),
        text: toolInputText(part.input),
        running: part.state === "input-streaming" || part.state === "input-available",
      });
    }
  }
  return steps;
}

/** Convert a Vercel AI SDK ChatUIMessage into the UI view-model for rendering. */
export function toRenderableUIMessage(
  msg: ChatUIMessage,
  errorText?: string,
  errorId?: string
): UIMessage {
  let content = "";
  for (const part of msg.parts) {
    if (isTextUIPart(part) && part.text) {
      if (content && !content.endsWith("\n")) {
        content += "\n\n";
      }
      content += part.text;
    }
  }

  return {
    id: msg.id,
    role: msg.role === "assistant" ? "ai" : "user",
    content,
    steps: replySteps(msg),
    error: errorText,
    errorId,
    attachments: msg.metadata?.attachments,
    modelId: msg.metadata?.modelId,
  };
}
