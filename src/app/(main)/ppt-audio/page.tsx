import PptAudio from "@/features/(main)/PptToAudio/components/PptAudio";

export default async function PptAudioPage({
  searchParams,
}: {
  searchParams: Promise<{ documentId?: string | string[] }>;
}) {
  const value = (await searchParams).documentId;
  const documentId = Array.isArray(value) ? value[0] : value;

  return <PptAudio initialDocumentId={documentId} />;
}
