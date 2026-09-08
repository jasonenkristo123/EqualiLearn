import type { useGroupChat } from "../hooks/useGroupChat";
import type { ChatMessage } from "../service/groups";

export type Mode = "standard" | "focus" | "read-aloud";

export type ChatState = ReturnType<typeof useGroupChat>;

export interface HistoryLike {
  data?: { pages: { items: ChatMessage[] }[] };
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
}

export const MODE_LABEL: Record<Mode, string> = {
  standard: "Standar",
  focus: "Fokus",
  "read-aloud": "Baca nyaring",
};

export const DISCUSSION_MODE_STORAGE_KEY = "equalilearn-discussion-mode";

export function isMode(value: unknown): value is Mode {
  return value === "standard" || value === "focus" || value === "read-aloud";
}

export function isMine(message: ChatMessage, meId: string) {
  if (message.pending) return true;
  return Boolean(meId) && message.senderId === meId;
}

export function initials(value: string) {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function shortCode(id: string) {
  const tail = id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-4)
    .toUpperCase();
  return tail ? `EQL-${tail}` : "EQL";
}

export function formatClock(iso: string) {
  const time = new Date(iso);
  return Number.isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function documentIdFromMessage(content: string) {
  return content.match(/\/ppt-canvas\?documentId=([a-zA-Z0-9-]+)/)?.[1];
}

export function parseMemberEmails(raw: string) {
  return [...new Set(raw.split(/[,;\s]+/).filter(Boolean))];
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Merge polled history with not-yet-echoed local messages, newest last. */
export function mergeChatMessages(
  pages: { items: ChatMessage[] }[],
  pending: ChatMessage[],
  groupId: string,
): ChatMessage[] {
  const merged = new Map<string, ChatMessage>();
  for (const page of pages) {
    for (const message of page.items) {
      if (!message.groupId || message.groupId === groupId) {
        merged.set(message.id, message);
      }
    }
  }

  const dedupeKey = (m: ChatMessage) =>
    `${m.senderId || m.author}::${m.content}`;
  const confirmed = new Set([...merged.values()].map(dedupeKey));
  for (const local of pending) {
    if (!confirmed.has(dedupeKey(local))) merged.set(local.id, local);
  }

  return [...merged.values()].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}
