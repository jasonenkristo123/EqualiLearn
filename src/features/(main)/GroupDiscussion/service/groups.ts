import { api } from "@/shared/lib/axios";

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface GroupInput {
  name: string;
  description: string;
  member_emails: string[];
  member_user_ids: string[];
}

export interface PageResult<T> {
  items: T[];
  hasMore: boolean;
}

export const groupKeys = {
  lists: ["chat-groups"] as const,
  detail: (id: string) => ["chat-group", id] as const,
  messages: (id: string) => ["chat-messages", id] as const,
};

export function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value : "";
}

function unwrap(value: unknown) {
  const envelope = record(value);
  return envelope.data ?? value;
}

function parseMember(value: unknown): GroupMember {
  const member = record(value);
  const user = record(member.user);
  return {
    // Never use a membership record ID as a user ID for removal.
    userId: string(member.user_id) || string(user.id),
    name: string(user.name) || string(member.name) || string(member.email),
    email: string(user.email) || string(member.email),
    role: string(member.role) || "member",
  };
}

function parseGroup(value: unknown): ChatGroup {
  const group = record(unwrap(value));
  if (!string(group.id) || !string(group.name)) {
    throw new Error("Respons grup tidak berisi id dan nama yang valid.");
  }
  return {
    id: string(group.id),
    name: string(group.name),
    description: string(group.description),
    members: Array.isArray(group.members) ? group.members.map(parseMember) : [],
  };
}

export function parseChatMessage(value: unknown, groupId: string): ChatMessage {
  const message = record(value);
  const sender = record(message.sender ?? message.user);
  const content =
    string(message.content) || string(message.text) || string(message.message);
  if (!string(message.id) || !content) {
    throw new Error("Format riwayat pesan belum dikenali.");
  }
  return {
    id: string(message.id),
    groupId: string(message.group_id) || groupId,
    author:
      string(sender.name) ||
      string(message.sender_name) ||
      string(message.user_name) ||
      "Anggota",
    content,
    createdAt: string(message.created_at),
  };
}

function pageResult<T>(
  value: unknown,
  page: number,
  parse: (item: unknown) => T,
): PageResult<T> {
  const envelope = record(value);
  const raw = envelope.data;
  if (raw !== null && !Array.isArray(raw)) {
    throw new Error("Format daftar dari server belum dikenali.");
  }
  const items = (raw ?? []).map(parse);
  const pagination = record(envelope.pagination);
  const limit = typeof pagination.limit === "number" ? pagination.limit : 20;
  const total = envelope.total ?? pagination.total;
  return {
    items,
    hasMore:
      typeof total === "number" ? page * limit < total : items.length >= limit,
  };
}

export async function listGroups(page: number) {
  const { data } = await api.get<unknown>("groups", {
    params: { page, limit: 20 },
  });
  return pageResult(data, page, parseGroup);
}

export async function createGroup(input: GroupInput) {
  const { data } = await api.post<unknown>("groups", input);
  return parseGroup(data);
}

export async function getGroup(id: string) {
  const { data } = await api.get<unknown>(`groups/${encodeURIComponent(id)}`);
  return parseGroup(data);
}

export async function getMessages(id: string, page: number) {
  const { data } = await api.get<unknown>(
    `groups/${encodeURIComponent(id)}/messages`,
    {
      params: { page, limit: 20 },
    },
  );
  return pageResult(data, page, (value) => parseChatMessage(value, id));
}

export async function addMember(id: string, email: string) {
  await api.post(`groups/${encodeURIComponent(id)}/members`, {
    email,
    role: "member",
  });
}

export async function removeMember(id: string, userId: string) {
  await api.delete(
    `groups/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
  );
}
