import CanvasDiscussion from "@/features/(main)/GroupDiscussion/components/CanvasDiscussion";

export default async function CanvasDiscussionPage({
  searchParams,
}: {
  searchParams: Promise<{
    groupId?: string | string[];
    documentId?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const groupId = Array.isArray(params.groupId)
    ? params.groupId[0]
    : params.groupId;
  const documentId = Array.isArray(params.documentId)
    ? params.documentId[0]
    : params.documentId;
  return (
    <CanvasDiscussion initialGroupId={groupId} initialDocumentId={documentId} />
  );
}
