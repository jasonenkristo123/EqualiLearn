import type {
  NormalizedDocumentSummary,
  Takeaway,
  TranscriptParagraph,
} from "../type/ppt-audio.type";

const SUMMARY_KEYS = [
  "summary",
  "summary_text",
  "executive_summary",
  "detailed_summary",
  "overview",
  "result",
] as const;
const TRANSCRIPT_KEYS = [
  "transcript",
  "paragraphs",
  "sections",
  "explanation",
  "extracted_text",
  "content",
  "text",
  "full_text",
  "original_text",
] as const;
const TAKEAWAY_KEYS = [
  "key_takeaways",
  "key_points",
  "takeaways",
  "highlights",
  "main_points",
  "key_concepts",
] as const;

export function normalizeDocumentSummary(
  response: unknown,
  file?: Pick<File, "name" | "lastModified">,
): NormalizedDocumentSummary {
  const payload = unwrapData(response);
  const summaryText = findString(payload, SUMMARY_KEYS);
  const rawTranscript = findValue(payload, TRANSCRIPT_KEYS);
  const transcriptText = extractText(rawTranscript) || summaryText;
  const narrationText = summaryText || transcriptText;

  return {
    documentId:
      findString(payload, ["id", "document_id", "summary_id"]) ||
      (file ? `${file.name}-${file.lastModified}` : ""),
    fileName:
      findString(payload, ["file_name", "filename", "name"]) ||
      file?.name ||
      "Dokumen",
    fileType: findString(payload, ["file_type", "type"]),
    pageCount: findNumber(payload, ["page_count", "pages", "total_pages"]),
    narrationText,
    takeaways: normalizeTakeaways(
      findValue(payload, TAKEAWAY_KEYS),
      summaryText,
    ),
    transcript: normalizeTranscript(rawTranscript, transcriptText),
  };
}

function normalizeTakeaways(value: unknown, fallback: string): Takeaway[] {
  const items = Array.isArray(value) ? value : [];
  const takeaways = items.flatMap((item, index): Takeaway[] => {
    if (typeof item === "string" && item.trim()) {
      return [
        {
          id: `takeaway-${index}`,
          title: `Key Takeaway ${index + 1}`,
          summary: item.trim(),
        },
      ];
    }
    if (!isRecord(item)) return [];

    const summary = readOwnString(item, ["summary", "description", "text"]);
    const title =
      readOwnString(item, ["title", "name", "heading", "topic"]) ||
      `Key Takeaway ${index + 1}`;
    const rawTags = item.tags ?? item.keywords;
    const tags = Array.isArray(rawTags)
      ? rawTags.filter((tag): tag is string => typeof tag === "string")
      : undefined;

    return summary ? [{ id: `takeaway-${index}`, title, summary, tags }] : [];
  });

  if (takeaways.length > 0) return takeaways;
  if (!fallback) return [];
  return [
    {
      id: "takeaway-summary",
      title: "Ringkasan Dokumen",
      summary: fallback,
    },
  ];
}

function normalizeTranscript(
  value: unknown,
  fallback: string,
): TranscriptParagraph[] {
  const textItems = Array.isArray(value)
    ? value.map(extractText).filter(Boolean)
    : splitIntoParagraphs(extractText(value) || fallback);

  return textItems.map((text, index) => ({
    id: `paragraph-${index}`,
    text,
    // The API does not return timestamps yet; use a predictable estimate.
    atSeconds: index * 15,
  }));
}

function splitIntoParagraphs(text: string) {
  if (!text) return [];
  const lines = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return lines.slice(0, 40);
}

function unwrapData(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return value.data && typeof value.data === "object" ? value.data : value;
}

function findValue(
  value: unknown,
  keys: readonly string[],
  depth = 0,
): unknown {
  if (!isRecord(value) || depth > 3) return undefined;
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null) return value[key];
  }
  for (const nested of Object.values(value)) {
    const found = findValue(nested, keys, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function findString(value: unknown, keys: readonly string[]) {
  return extractText(findValue(value, keys));
}

function findNumber(value: unknown, keys: readonly string[]) {
  const found = findValue(value, keys);
  return typeof found === "number" && Number.isFinite(found) ? found : 0;
}

function readOwnString(
  value: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    if (typeof value[key] === "string") return value[key].trim();
  }
  return "";
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("\n");
  }
  if (isRecord(value)) {
    return readOwnString(value, [
      "text",
      "content",
      "summary",
      "summary_text",
      "executive_summary",
      "overview",
      "description",
      "title",
    ]);
  }
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
