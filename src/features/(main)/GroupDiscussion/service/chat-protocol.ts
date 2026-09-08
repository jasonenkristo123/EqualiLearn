import type { ChatMessage } from "./groups";
import { parseChatMessage, record } from "./groups";

export type ChatEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "ack"; clientId: string; message: ChatMessage }
  | { type: "error"; message: string };

/**
 * Wire adapter for `GET ws/chat`.
 *
 * The backend has not published a schema. What is confirmed:
 * - the endpoint is `<API base>/ws/chat` and rejects a tokenless request with
 *   `{"error":"missing authentication token"}`;
 * - the token travels as a query parameter (browsers cannot set WS headers).
 *
 * Everything else here is a best guess kept in one place so it is cheap to
 * correct once a real example is available. `useGroupChat` treats a socket
 * write as unconfirmed and still polls REST history as the source of truth,
 * so a wrong guess degrades to "history only", it does not lose messages.
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

const adapter: ChatProtocol = {
  url(apiBase, token, groupId) {
    const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
    const socketUrl = new URL("ws/chat", base);
    socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
    socketUrl.searchParams.set("token", token);
    // Harmless if the server ignores it; lets a per-room server scope the socket.
    socketUrl.searchParams.set("group_id", groupId);
    return socketUrl.toString();
  },

  subscribe(groupId) {
    return { type: "join", group_id: groupId };
  },

  encode(groupId, content, clientId) {
    return { type: "message", group_id: groupId, content, client_id: clientId };
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
          string(envelope.error) ||
          string(envelope.message) ||
          "Layanan chat mengembalikan kesalahan.",
      };
    }
    if (
      kind === "pong" ||
      kind === "ping" ||
      kind === "join" ||
      kind === "joined"
    ) {
      return null;
    }

    // The message body may be the frame itself or nested under a common key.
    const body =
      envelope.message ?? envelope.data ?? envelope.payload ?? envelope;
    let message: ChatMessage;
    try {
      message = parseChatMessage(body, groupId);
    } catch {
      return null;
    }

    const clientId =
      string(record(body).client_id) || string(envelope.client_id);
    if ((kind === "ack" || envelope.ack) && clientId) {
      return { type: "ack", clientId, message };
    }
    return { type: "message", message };
  },
};

export function getChatProtocol(): ChatProtocol | null {
  return adapter;
}
