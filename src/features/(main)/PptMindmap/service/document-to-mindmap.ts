import type { DocumentSummary } from "@/shared/api/documents";
import type {
  ConceptFlowNode,
  ConceptIcon,
  ExtractedConcept,
  MindmapEdge,
} from "../type/mindmap.type";

const ROOT_ID = "root";
const COLUMN_GAP = 290;
const ROW_GAP = 230;
const MAX_COLUMNS = 3;
const CONCEPT_ICONS: ConceptIcon[] = [
  "network",
  "database",
  "shield",
  "activity",
];

export interface GeneratedMindmap {
  nodes: ConceptFlowNode[];
  edges: MindmapEdge[];
  extractedConcepts: ExtractedConcept[];
}

export function documentToMindmap(document: DocumentSummary): GeneratedMindmap {
  const concepts = document.key_points
    .map(splitConcept)
    .filter((concept) => concept.title || concept.description);

  const root: ConceptFlowNode = {
    id: ROOT_ID,
    type: "concept",
    position: { x: 0, y: 0 },
    data: {
      label: "Document Summary",
      title: document.title || document.file_name,
      description: compactText(document.summary, 320),
      badge: document.language.toUpperCase(),
      icon: "sparkles",
      variant: "root",
    },
  };

  const conceptNodes = concepts.map((concept, index): ConceptFlowNode => {
    const row = Math.floor(index / MAX_COLUMNS);
    const itemsInRow = Math.min(
      MAX_COLUMNS,
      concepts.length - row * MAX_COLUMNS,
    );
    const column = index % MAX_COLUMNS;

    return {
      id: `key-point-${index + 1}`,
      type: "concept",
      position: {
        x: (column - (itemsInRow - 1) / 2) * COLUMN_GAP,
        y: 240 + row * ROW_GAP,
      },
      data: {
        title: concept.title,
        description: compactText(concept.description, 260),
        badge: `POINT ${index + 1}`,
        icon: CONCEPT_ICONS[index % CONCEPT_ICONS.length],
        variant: "concept",
      },
    };
  });

  const edges = conceptNodes.map(
    (node): MindmapEdge => ({
      id: `e-${ROOT_ID}-${node.id}`,
      source: ROOT_ID,
      target: node.id,
    }),
  );

  const explanationConcepts = parseExplanation(document.explanation);
  const extractedConcepts = (
    explanationConcepts.length > 0 ? explanationConcepts : concepts
  ).map((concept, index) => ({
    id: `extracted-${index + 1}`,
    title: concept.title,
    description: compactText(concept.description, 360),
    sourceLabel: "AI Summary",
  }));

  return {
    nodes: [root, ...conceptNodes],
    edges,
    extractedConcepts,
  };
}

function splitConcept(value: string) {
  const text = cleanMarkdown(value);
  const separator = text.indexOf(":");
  if (separator <= 0 || separator > 90) {
    return { title: firstSentence(text), description: text };
  }

  return {
    title: text.slice(0, separator).trim(),
    description: text.slice(separator + 1).trim(),
  };
}

function parseExplanation(value: string) {
  if (!value.trim()) return [];

  const sections: Array<{ title: string; description: string }> = [];
  let currentTitle = "Penjelasan";
  let currentBody: string[] = [];

  const commit = () => {
    const description = cleanMarkdown(currentBody.join(" "));
    if (description) sections.push({ title: currentTitle, description });
    currentBody = [];
  };

  for (const line of value.split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      commit();
      currentTitle = cleanMarkdown(heading[1]);
    } else if (line.trim() && !/^---+$/.test(line.trim())) {
      currentBody.push(line.trim());
    }
  }
  commit();

  return sections;
}

function cleanMarkdown(value: string) {
  return value
    .replace(/[*_`>#]/g, "")
    .replace(/^[-•]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(value: string) {
  const sentence = value.match(/^.{1,80}?(?=[.!?](?:\s|$))/)?.[0];
  return sentence || compactText(value, 70);
}

function compactText(value: string, maxLength: number) {
  const text = cleanMarkdown(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
