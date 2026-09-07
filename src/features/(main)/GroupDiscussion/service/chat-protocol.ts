import type { ChatMessage } from "./groups";

export type ChatEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "error"; message: string };

/**
 * The backend has supplied only GET ws/chat, not its wire contract.
 * Implement this adapter from a backend example before enabling chat.
 * Do not assume token query params, room subscription events, or payload keys.
 */
export interface ChatProtocol {
  url: (apiBase: string, token: string, groupId: string) => string;
  subscribe?: (groupId: string) => unknown;
  encode: (groupId: string, content: string) => unknown;
  decode: (raw: string) => ChatEvent | null;
}

export function getChatProtocol(): ChatProtocol | null {
  return null;
}
