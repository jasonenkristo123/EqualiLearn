"use client";

import { DiscussionRoom } from "./DiscussionRoom";
import { GroupLanding } from "./GroupLanding";

export default function CanvasDiscussion({
  initialGroupId = "",
  initialDocumentId = "",
}: {
  initialGroupId?: string;
  initialDocumentId?: string;
}) {
  if (!initialGroupId) {
    return <GroupLanding initialDocumentId={initialDocumentId} />;
  }
  return (
    <DiscussionRoom
      key={initialGroupId}
      groupId={initialGroupId}
      documentId={initialDocumentId}
    />
  );
}
