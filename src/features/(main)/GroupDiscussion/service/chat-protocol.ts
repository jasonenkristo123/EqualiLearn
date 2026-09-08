import type { ChatMessage } from "./groups";
import { parseChatMessage, record } from "./groups";

export type ChatEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "ack"; clientId: string; message: ChatMessage }
  | { type: "connected"; userId: string }
  | { type: "error"; message: string };

/**
 * Wire adapter for `GET /api/v1/ws/chat`.
 *
 * Implemented from the backend reference:
 * - connect at `<API base>/ws/chat?token=<JWT>&group_id=<uuid>` (browsers
 *   cannot set WS headers, so the token travels as a query parameter and the
 *   optional `group_id` auto-joins that room on connect);
 * - on open the server sends `{ type: "connected", payload: { user_id } }`;
 * - a text message is sent as
 *   `{ type: "chat_message", group_id, content, message_type: "text" }`;
 * - the server re-broadcasts it to every member as
 *   `{ type: "chat_message", group_id, payload: { id, group_id, sender_id,
 *     sender_name, sender_email, content, message_type, created_at } }`;
 * - failures arrive as `{ type: "error", group_id, payload: "<reason string>" }`.
 *
 * The protocol carries no client-supplied correlation id, so `encode` ignores
 * `clientId` and `useGroupChat` reconciles an optimistic message by matching
 * `sender_id` + `content` on the echoed broadcast (and, as a backstop, against
 * polled REST history).
 */
export interface ChatProtocol {
  url: (apiBase: string, token: string, groupId: string) => string;
  /** Optional first frame after `open`, e.g. a room join. */
  subscribe?: (groupId: string) => unknown;
  encode: (groupId: string, content: string, clientId: string) => unknown;
  decode: (raw: string, groupId: string) => ChatEvent | null;
}

function string(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** Control frames that are not chat history and carry nothing to render. */
const IGNORED_TYPES = new Set([
  "typing",
  "join_group",
  "leave_group",
  "ping",
  "pong",
]);

const adapter: ChatProtocol = {
  url(apiBase, token, groupId) {
    const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
    const socketUrl = new URL("ws/chat", base);
    socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
    socketUrl.searchParams.set("token", token);
    // Auto-joins the room on connect per the backend contract.
    if (groupId) socketUrl.searchParams.set("group_id", groupId);
    return socketUrl.toString();
  },

  subscribe(groupId) {
    // Redundant with `group_id` in the URL, but harmless and keeps the room
    // membership explicit if the socket is ever reused across groups.
    return { type: "join_group", group_id: groupId };
  },

  encode(groupId, content) {
    return {
      type: "chat_message",
      group_id: groupId,
      content,
      message_type: "text",
    };
  },

  decode(raw, groupId) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const envelope = record(parsed);
    const kind = string(envelope.type) || string(envelope.event);

    if (kind === "error" || envelope.error) {
      return {
        type: "error",
        message:
          string(envelope.payload) ||
          string(envelope.error) ||
          string(envelope.message) ||
          "Layanan chat mengembalikan kesalahan.",
      };
    }

    if (kind === "connected") {
      const payload = record(envelope.payload);
      return { type: "connected", userId: string(payload.user_id) };
    }

    if (IGNORED_TYPES.has(kind)) return null;

    // A chat message body lives under `payload`; tolerate a few nestings.
    const body =
      envelope.payload ?? envelope.message ?? envelope.data ?? envelope;
    let message: ChatMessage;
    try {
      message = parseChatMessage(body, groupId);
    } catch {
      return null;
    }
    return { type: "message", message };
  },
};

export function getChatProtocol(): ChatProtocol | null {
  return adapter;
}
