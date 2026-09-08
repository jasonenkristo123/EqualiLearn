import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getDocumentErrorMessage } from "@/shared/api/documents";
import { useGroupChat } from "../hooks/useGroupChat";
import {
  currentUser,
  getGroup,
  getMessages,
  groupKeys,
} from "../service/groups";
import {
  DISCUSSION_MODE_STORAGE_KEY,
  isMode,
  type Mode,
  mergeChatMessages,
} from "../util/discussion";
import { softButton } from "../util/styles";
import { CanvasPanel } from "./CanvasPanel";
import { ChatPanel } from "./ChatPanel";
import { ErrorNotice } from "./ErrorNotice";

export function DiscussionRoom({
  groupId,
  documentId,
}: {
  groupId: string;
  documentId: string;
}) {
  const me = useMemo(() => currentUser(), []);
  const [mode, setMode] = useState<Mode>("standard");
  const [canvasOpen, setCanvasOpen] = useState(true);
  const [previewId, setPreviewId] = useState(documentId);
  const [draft, setDraft] = useState("");
  const [roomError, setRoomError] = useState("");

  const room = useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => getGroup(groupId),
    retry: false,
    // Invites/removals have no realtime event, so keep the roster fresh.
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const history = useInfiniteQuery({
    queryKey: groupKeys.messages(groupId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getMessages(groupId, pageParam),
    getNextPageParam: (page, pages) =>
      page.hasMore ? pages.length + 1 : undefined,
    enabled: room.isSuccess,
    retry: false,
    refetchInterval: 15000,
  });
  const chat = useGroupChat(groupId);
  const meId = chat.selfId || me.id;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISCUSSION_MODE_STORAGE_KEY);
      if (isMode(saved)) {
        setMode(saved);
        if (saved === "focus") setCanvasOpen(false);
      }
    } catch {
      /* Preferences remain optional. */
    }
    return () => window.speechSynthesis?.cancel();
  }, []);

  const changeMode = (value: Mode) => {
    setMode(value);
    window.speechSynthesis?.cancel();
    if (value === "focus") setCanvasOpen(false);
    try {
      localStorage.setItem(DISCUSSION_MODE_STORAGE_KEY, value);
    } catch {
      /* Optional. */
    }
  };

  const messages = useMemo(
    () => mergeChatMessages(history.data?.pages ?? [], chat.pending, groupId),
    [history.data, chat.pending, groupId],
  );

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setRoomError("");
    try {
      chat.send(text);
      setDraft("");
    } catch (cause) {
      setRoomError(getDocumentErrorMessage(cause));
    }
  };

  if (room.isPending) {
    return (
      <div className="p-6 text-sm text-white/60">Memuat ruang diskusi…</div>
    );
  }
  if (room.isError) {
    return (
      <div className="space-y-3 p-6 text-white">
        <ErrorNotice message={getDocumentErrorMessage(room.error)} />
        <button
          type="button"
          className={softButton}
          onClick={() => void room.refetch()}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] p-3 text-white lg:p-4">
      <div
        className={cn(
          "grid h-full min-h-0 gap-3",
          canvasOpen
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
            : "lg:grid-cols-1",
        )}
      >
        <ChatPanel
          group={room.data}
          meId={meId}
          mode={mode}
          onChangeMode={changeMode}
          messages={messages}
          history={history}
          chat={chat}
          draft={draft}
          onDraft={setDraft}
          onSend={send}
          error={roomError}
          onError={setRoomError}
          onPreviewDocument={setPreviewId}
          onShareDocument={(id, title) => {
            setPreviewId(id);
            setCanvasOpen(true);
            setDraft(
              `Mind map: ${title}\n${window.location.origin}/ppt-canvas?documentId=${encodeURIComponent(id)}`,
            );
          }}
          canvasOpen={canvasOpen}
          onShowCanvas={() => setCanvasOpen(true)}
        />

        {canvasOpen && (
          <CanvasPanel
            editingCount={Math.max(1, room.data.members.length || 1)}
            previewId={previewId}
            onHide={() => setCanvasOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
