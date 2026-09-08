import type { SpeechSocketMessage } from "../type/speech-to-text.type";

const SPEECH_TO_TEXT_PATH = "ws/speech-to-text";

export function getSpeechToTextUrl(language: string) {
  const configuredSocketUrl = process.env.NEXT_PUBLIC_WS_URL;

  if (configuredSocketUrl) {
    const socketUrl = new URL(configuredSocketUrl);
    socketUrl.searchParams.set("lang", language);
    return socketUrl.toString();
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
  if (!apiBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_BASE_API_URL atau NEXT_PUBLIC_WS_URL belum dikonfigurasi.",
    );
  }

  const normalizedBaseUrl = apiBaseUrl.endsWith("/")
    ? apiBaseUrl
    : `${apiBaseUrl}/`;
  const socketUrl = new URL(SPEECH_TO_TEXT_PATH, normalizedBaseUrl);
  socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
  socketUrl.searchParams.set("lang", language);

  return socketUrl.toString();
}

export function parseSpeechSocketMessage(
  rawMessage: string,
): SpeechSocketMessage | null {
  try {
    const value: unknown = JSON.parse(rawMessage);
    if (!isRecord(value) || typeof value.type !== "string") return null;
    if (!isRecord(value.payload)) return null;

    switch (value.type) {
      case "ready":
      case "transcript":
      case "finished":
      case "error":
        return value as unknown as SpeechSocketMessage;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
