import PptCanvas from "@/features/(main)/PptMindmap/components/PptCanvas";

export default async function PptCanvasPage({
  searchParams,
}: {
  searchParams: Promise<{ documentId?: string | string[] }>;
}) {
  const value = (await searchParams).documentId;
  const documentId = Array.isArray(value) ? value[0] : value;

  return <PptCanvas initialDocumentId={documentId} />;
}
