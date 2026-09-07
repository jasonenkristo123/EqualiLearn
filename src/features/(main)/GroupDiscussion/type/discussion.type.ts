export type DiscussionMode = "standar" | "fokus" | "santai";

export type MessageKind = "text" | "voice";

/** Accessibility bridge applied to a message, surfaced as a caption. */
export type AccessibilityAssist = "voice-to-text" | "text-to-speech";

export interface Participant {
  id: string;
  name: string;
  /** Presence / cursor color (any CSS color). */
  color: string;
}

export interface DiscussionMessage {
  id: string;
  authorId: string;
  authorName: string;
  /** Pre-formatted clock time, e.g. "10:42 AM". */
  timestamp: string;
  kind: MessageKind;
  /** Body for text messages; transcript for voice messages. */
  text: string;
  /** Render on the trailing side as the current user's own message. */
  own?: boolean;
  /** Duration label shown on the voice player, e.g. "0:12". */
  voiceDurationLabel?: string;
  assist?: AccessibilityAssist;
}

export interface SharedMapNode {
  id: string;
  label: string;
  caption?: string;
  /** Position as a percentage (0–100) of the canvas box. */
  x: number;
  y: number;
  variant?: "default" | "primary";
  /** Participant id currently editing this node — drives the collaborator badge. */
  editingBy?: string;
}

export interface SharedMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface DiscussionRoom {
  id: string;
  name: string;
  /** Shareable join code, e.g. "EQL-8921". */
  code: string;
  mode: DiscussionMode;
}
