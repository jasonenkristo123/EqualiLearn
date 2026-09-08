"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  AudioLines,
  Check,
  ChevronDown,
  Copy,
  Download,
  Link2,
  Mic,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Send,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { getDocument, getDocumentErrorMessage } from "@/shared/api/documents";
import { useGroupChat } from "../hooks/useGroupChat";
import {
  addMember,
  type ChatGroup,
  type ChatMessage,
  createGroup,
  currentUser,
  getGroup,
  getMessages,
  groupKeys,
  listGroups,
  removeMember,
} from "../service/groups";

type Mode = "standard" | "focus" | "read-aloud";

const MODE_LABEL: Record<Mode, string> = {
  standard: "Standar",
  focus: "Fokus",
  "read-aloud": "Baca nyaring",
};

const surface = "rounded-2xl border border-white/10 bg-[#0a111b]";
const softButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";
const field =
  "w-full rounded-lg border border-white/15 bg-[#070d15] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-500/70";

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

/* -------------------------------------------------------------------------- */
/*  Landing: pick or create a group                                          */
/* -------------------------------------------------------------------------- */

function GroupLanding({ initialDocumentId }: { initialDocumentId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [error, setError] = useState("");

  const groups = useInfiniteQuery({
    queryKey: groupKeys.lists,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listGroups(pageParam),
    getNextPageParam: (page, pages) =>
      page.hasMore ? pages.length + 1 : undefined,
    retry: false,
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const create = useMutation({ mutationFn: createGroup });

  const rooms = [
    ...new Map(
      groups.data?.pages
        .flatMap((page) => page.items)
        .map((group) => [group.id, group]),
    ).values(),
  ];

  const open = (id: string) => {
    const params = new URLSearchParams({ groupId: id });
    if (initialDocumentId) params.set("documentId", initialDocumentId);
    router.push(`/canvas-discussion?${params}`);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    const emails = [
      ...new Set(
        String(values.get("emails") ?? "")
          .split(/[,;\s]+/)
          .filter(Boolean),
      ),
    ];
    if (!name) return;
    if (emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError("Periksa kembali alamat email anggota.");
      return;
    }
    setError("");
    try {
      const room = await create.mutateAsync({
        name,
        description: String(values.get("description") ?? "").trim(),
        member_emails: emails,
        member_user_ids: [],
      });
      client.setQueryData(groupKeys.detail(room.id), room);
      void client.invalidateQueries({ queryKey: groupKeys.lists });
      open(room.id);
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 text-white lg:grid-cols-2 lg:p-8">
      <section className={cn(surface, "p-6")}>
        <h1 className="text-lg font-semibold">Buat ruang diskusi</h1>
        <p className="mt-1 text-sm text-white/60">
          Ketua kelompok membuat grup, lalu menambahkan email anggota agar
          mereka bisa bergabung dan mengobrol.
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm">
            Nama grup
            <input required maxLength={120} name="name" className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Deskripsi <span className="text-white/40">(opsional)</span>
            <textarea name="description" maxLength={2000} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Email anggota <span className="text-white/40">(opsional)</span>
            <textarea
              name="emails"
              rows={2}
              placeholder="budi@example.com, siti@example.com"
              className={field}
            />
          </label>
          {error && <ErrorNotice message={error} />}
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            <Plus size={16} />
            {create.isPending ? "Membuat grup…" : "Buat grup"}
          </button>
        </form>
      </section>

      <section className={cn(surface, "flex flex-col p-6")}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Grup Anda</h2>
          <button
            type="button"
            className={softButton}
            disabled={groups.isFetching}
            onClick={() => void groups.refetch()}
          >
            <RefreshCw size={13} />
            Muat ulang
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-2">
          {groups.isPending && (
            <output className="text-sm text-white/60">Memuat grup…</output>
          )}
          {groups.error && (
            <ErrorNotice message={getDocumentErrorMessage(groups.error)} />
          )}
          {groups.isSuccess && rooms.length === 0 && (
            <p className="rounded-lg border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/55">
              Belum ada grup. Buat grup pertama Anda, atau minta ketua kelompok
              menambahkan email Anda.
            </p>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => open(room.id)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <span>
                <span className="font-medium">{room.name}</span>
                {room.description && (
                  <span className="mt-0.5 block text-xs text-white/50">
                    {room.description}
                  </span>
                )}
              </span>
              <span className="text-xs text-white/40">Buka</span>
            </button>
          ))}
          {groups.hasNextPage && (
            <button
              type="button"
              className={softButton}
              disabled={groups.isFetchingNextPage}
              onClick={() => void groups.fetchNextPage()}
            >
              Muat lebih banyak
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function DiscussionRoom({
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
    // Keep the member roster fresh while the room is open (invites/removals
    // have no realtime event).
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
      const saved = localStorage.getItem("equalilearn-discussion-mode");
      if (saved === "standard" || saved === "focus" || saved === "read-aloud") {
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
      localStorage.setItem("equalilearn-discussion-mode", value);
    } catch {
      /* Optional. */
    }
  };

  const messages = useMemo(() => {
    const merged = new Map<string, ChatMessage>();
    for (const page of history.data?.pages ?? []) {
      for (const message of page.items) {
        if (!message.groupId || message.groupId === groupId) {
          merged.set(message.id, message);
        }
      }
    }

    const dedupeKey = (m: ChatMessage) =>
      `${m.senderId || m.author}::${m.content}`;
    const confirmed = new Set([...merged.values()].map(dedupeKey));
    for (const local of chat.pending) {
      if (!confirmed.has(dedupeKey(local))) {
        merged.set(local.id, local);
      }
    }
    return [...merged.values()].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  }, [history.data, chat.pending, groupId]);

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

/* -------------------------------------------------------------------------- */
/*  Chat panel                                                               */
/* -------------------------------------------------------------------------- */

type ChatState = ReturnType<typeof useGroupChat>;
interface HistoryLike {
  data?: { pages: { items: ChatMessage[] }[] };
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
}

function ChatPanel({
  group,
  meId,
  mode,
  onChangeMode,
  messages,
  history,
  chat,
  draft,
  onDraft,
  onSend,
  error,
  onError,
  onPreviewDocument,
  onShareDocument,
  canvasOpen,
  onShowCanvas,
}: {
  group: ChatGroup;
  meId: string;
  mode: Mode;
  onChangeMode: (mode: Mode) => void;
  messages: ChatMessage[];
  history: HistoryLike;
  chat: ChatState;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  error: string;
  onError: (message: string) => void;
  onPreviewDocument: (id: string) => void;
  onShareDocument: (id: string, title: string) => void;
  canvasOpen: boolean;
  onShowCanvas: () => void;
}) {
  const logRef = useRef<HTMLDivElement>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const atBottomRef = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: follow tail on new messages
  useEffect(() => {
    const log = logRef.current;
    if (log && atBottomRef.current) log.scrollTop = log.scrollHeight;
  }, [messages.length]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.code || group.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onError("Tidak bisa menyalin kode. Salin manual dari kolom kode.");
    }
  };

  const onComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <section className={cn(surface, "relative flex min-h-0 flex-col")}>
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <Link
          href="/canvas-discussion"
          aria-label="Kembali ke daftar grup"
          className="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={15} />
        </Link>
        <h2 className="text-sm font-semibold">{group.name}</h2>
        <button
          type="button"
          onClick={copyCode}
          title="Salin kode grup"
          className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300 transition hover:bg-sky-500/25"
        >
          {group.code || shortCode(group.id)}
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <AvatarStack members={group.members} />
          <button
            type="button"
            onClick={() => {
              setShowInvite((v) => !v);
              setShowShare(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600/90 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
          >
            <UserPlus size={13} />
            Undang
          </button>
          <ModeMenu mode={mode} onChange={onChangeMode} />
        </div>
      </header>

      {showInvite && (
        <InvitePanel group={group} onClose={() => setShowInvite(false)} />
      )}
      {showShare && (
        <div className="border-b border-white/10 p-4">
          <ShareDocument
            onPrepared={(id, title) => {
              onShareDocument(id, title);
              setShowShare(false);
            }}
          />
        </div>
      )}

      {/* Connection status */}
      <ConnectionBar chat={chat} />

      {/* Messages */}
      <div
        ref={logRef}
        role="log"
        aria-label={`Pesan grup ${group.name}`}
        aria-live="polite"
        onScroll={(event) => {
          const el = event.currentTarget;
          atBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {history.isPending && (
          <output className="text-sm text-white/55">Memuat riwayat…</output>
        )}
        {history.error && (
          <div className="space-y-2">
            <ErrorNotice message={getDocumentErrorMessage(history.error)} />
            <button
              type="button"
              className={softButton}
              onClick={() => void history.refetch()}
            >
              Coba lagi
            </button>
          </div>
        )}
        {history.hasNextPage && (
          <button
            type="button"
            className={cn(softButton, "mx-auto flex")}
            disabled={history.isFetchingNextPage}
            onClick={() => void history.fetchNextPage()}
          >
            Muat pesan lama
          </button>
        )}
        {history.isSuccess && messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-white/50">
            Belum ada pesan. Mulai percakapan kelompok.
          </p>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            mine={isMine(message, meId)}
            mode={mode}
            onPreview={onPreviewDocument}
            onError={onError}
          />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 p-3">
        {error && <ErrorNotice message={error} className="mb-2" />}
        <div className="flex items-end gap-2 rounded-xl border border-white/15 bg-[#070d15] px-3 py-2">
          <textarea
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={onComposerKey}
            rows={1}
            maxLength={4000}
            placeholder="Ketik pesan…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm text-white outline-none placeholder:text-white/40"
          />
          <button
            type="button"
            disabled
            title="Rekam suara segera hadir"
            className="rounded-lg p-1.5 text-white/40"
          >
            <Mic size={18} />
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={!draft.trim() || chat.status !== "connected"}
            className="rounded-lg bg-sky-600 p-2 text-white transition hover:bg-sky-500 disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            title="Fitur suara segera hadir"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-white/45"
          >
            <Mic size={12} />
            Hold to Speak
          </button>
          <button
            type="button"
            onClick={() => {
              setShowShare((v) => !v);
              setShowInvite(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/20"
          >
            <Share2 size={12} />
            Bagikan Kanvas
          </button>
        </div>
      </div>

      {!canvasOpen && (
        <button
          type="button"
          onClick={onShowCanvas}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0a111b] px-2.5 py-1.5 text-xs text-white/80 shadow-lg transition hover:bg-white/10"
        >
          <PanelRightOpen size={13} />
          Tampilkan Kanvas
        </button>
      )}
    </section>
  );
}

function ConnectionBar({ chat }: { chat: ChatState }) {
  const label =
    chat.status === "connected"
      ? "Chat tersambung"
      : chat.status === "connecting"
        ? "Menyambungkan chat…"
        : chat.status === "authentication-required"
          ? "Sesi berakhir. Masuk kembali untuk mengirim pesan."
          : chat.status === "unconfigured"
            ? "Pengiriman real-time belum tersedia. Riwayat diperbarui tiap 15 detik."
            : "Chat terputus. Draf Anda tetap tersimpan.";
  const tone =
    chat.status === "connected"
      ? "text-emerald-300"
      : chat.status === "connecting"
        ? "text-white/50"
        : "text-amber-300";

  if (chat.status === "connected" && !chat.error) return null;

  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-1.5 text-[11px]">
      <span className={tone}>{label}</span>
      {chat.error && (
        <button
          type="button"
          className="text-amber-300 underline"
          onClick={chat.clearError}
        >
          tutup
        </button>
      )}
      {chat.status === "disconnected" && (
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 text-sky-300 underline"
          onClick={chat.reconnect}
        >
          <RefreshCw size={11} />
          Sambungkan kembali
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  mode,
  onPreview,
  onError,
}: {
  message: ChatMessage;
  mine: boolean;
  mode: Mode;
  onPreview: (id: string) => void;
  onError: (message: string) => void;
}) {
  const documentId = message.content.match(
    /\/ppt-canvas\?documentId=([a-zA-Z0-9-]+)/,
  )?.[1];
  const time = new Date(message.createdAt);
  const clock = Number.isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const read = () => {
    if (!("speechSynthesis" in window)) {
      onError("Browser ini belum mendukung pembacaan suara.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "id-ID";
    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled") {
        onError("Pesan tidak dapat dibacakan. Coba browser lain.");
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
    >
      <div className="px-1 text-[11px] text-white/45">
        {mine ? clock : `${message.author}${clock ? ` · ${clock}` : ""}`}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap break-words",
          mode === "focus" ? "text-base leading-relaxed" : "text-sm",
          mine
            ? "rounded-br-md bg-sky-600 text-white"
            : "rounded-bl-md bg-white/[0.06] text-white/90",
          message.pending && "opacity-60",
        )}
      >
        {message.content}
        {message.pending && (
          <span className="ml-2 align-middle text-[10px] text-white/60">
            mengirim…
          </span>
        )}
      </div>

      {documentId && (
        <div className="flex gap-2 px-1">
          <Link
            href={`/ppt-canvas?documentId=${documentId}`}
            className={softButton}
          >
            Buka mind map
          </Link>
          <button
            type="button"
            className={softButton}
            onClick={() => onPreview(documentId)}
          >
            Pratinjau
          </button>
        </div>
      )}

      {mode === "read-aloud" && !mine && (
        <div className="flex items-center gap-2 px-1 text-[11px] text-sky-300/80">
          <AudioLines size={12} />
          <button type="button" className="underline" onClick={read}>
            Bacakan
          </button>
          <button
            type="button"
            className="underline"
            onClick={() => window.speechSynthesis?.cancel()}
          >
            Hentikan
          </button>
        </div>
      )}
    </div>
  );
}

function AvatarStack({ members }: { members: ChatGroup["members"] }) {
  const shown = members.slice(0, 3);
  const rest = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((member, index) => (
        <span
          key={member.userId || member.email || index}
          title={member.name || member.email}
          className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0a111b] bg-gradient-to-br from-sky-500 to-indigo-500 text-[10px] font-semibold text-white"
        >
          {initials(member.name || member.email || "?")}
        </span>
      ))}
      {rest > 0 && (
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0a111b] bg-white/15 text-[10px] font-semibold text-white">
          +{rest}
        </span>
      )}
      {members.length === 0 && (
        <span className="text-[11px] text-white/40">Belum ada anggota</span>
      )}
    </div>
  );
}

function ModeMenu({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={softButton}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {MODE_LABEL[mode]}
        <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-white/15 bg-[#0d1521] py-1 text-xs shadow-xl"
          >
            {(Object.keys(MODE_LABEL) as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={value === mode}
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-white/10",
                  value === mode && "text-sky-300",
                )}
              >
                {MODE_LABEL[value]}
                {value === mode && <Check size={12} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Invite / members                                                         */
/* -------------------------------------------------------------------------- */

function InvitePanel({
  group,
  onClose,
}: {
  group: ChatGroup;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  const invite = useMutation({
    mutationFn: (email: string) => addMember(group.id, email),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeMember(group.id, userId),
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    setError("");
    setNotice("");
    try {
      await invite.mutateAsync(email);
      await client.invalidateQueries({ queryKey: groupKeys.detail(group.id) });
      void client.invalidateQueries({ queryKey: groupKeys.lists });
      form.reset();
      setNotice(`Undangan untuk ${email} ditambahkan.`);
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  const confirmRemove = async () => {
    setError("");
    try {
      await remove.mutateAsync(removing);
      setRemoving("");
      await client.invalidateQueries({ queryKey: groupKeys.detail(group.id) });
      void client.invalidateQueries({ queryKey: groupKeys.lists });
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <div className="space-y-3 border-b border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Anggota grup</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="rounded p-1 text-white/50 hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>

      <ul className="space-y-1.5">
        {group.members.length === 0 && (
          <li className="text-xs text-white/50">
            Respons grup belum memuat daftar anggota.
          </li>
        )}
        {group.members.map((member, index) => (
          <li
            key={member.userId || member.email || index}
            className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs"
          >
            <span>
              {member.name || member.email || "Anggota"}
              <span className="ml-2 text-white/40">{member.role}</span>
            </span>
            <button
              type="button"
              className="text-white/45 hover:text-red-300 disabled:opacity-30"
              disabled={!member.userId || remove.isPending}
              onClick={() => setRemoving(member.userId)}
              aria-label="Keluarkan anggota"
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>

      {removing && (
        <div className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs">
          <span>Keluarkan anggota ini?</span>
          <button
            type="button"
            className="ml-auto text-red-300 underline disabled:opacity-40"
            disabled={remove.isPending}
            onClick={() => void confirmRemove()}
          >
            Ya
          </button>
          <button
            type="button"
            className="text-white/60 underline"
            onClick={() => setRemoving("")}
          >
            Batal
          </button>
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email anggota baru"
          className={field}
        />
        <button
          type="submit"
          disabled={invite.isPending}
          className="shrink-0 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {invite.isPending ? "…" : "Tambah"}
        </button>
      </form>
      {notice && <p className="text-xs text-emerald-300">{notice}</p>}
      {error && <ErrorNotice message={error} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Share a saved mind map into the chat                                     */
/* -------------------------------------------------------------------------- */

function ShareDocument({
  onPrepared,
}: {
  onPrepared: (id: string, title: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const load = useMutation({ mutationFn: getDocument });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const id = value.includes("?")
        ? new URL(value, window.location.origin).searchParams.get("documentId")
        : value.trim();
      if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
        throw new Error(
          "Tempel tautan Kanvas Pikir atau ID dokumen yang valid.",
        );
      }
      const response = await load.mutateAsync(id);
      onPrepared(
        response.data.id,
        response.data.title || response.data.file_name,
      );
      setValue("");
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <h3 className="text-sm font-semibold">Bagikan mind map</h3>
      <p className="text-xs text-white/55">
        Tempel tautan dari Kanvas Pikir. Tautannya dimasukkan ke kolom pesan,
        siap Anda kirim ke grup.
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          placeholder="/ppt-canvas?documentId=…"
          className={field}
        />
        <button
          type="submit"
          disabled={load.isPending}
          className="shrink-0 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {load.isPending ? "…" : "Siapkan"}
        </button>
      </div>
      <Link
        href="/ppt-canvas"
        className="inline-block text-xs text-sky-300 underline"
      >
        Buka Kanvas Pikir
      </Link>
      {error && <ErrorNotice message={error} />}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Canvas panel (visual placeholder + document preview)                     */
/* -------------------------------------------------------------------------- */

function CanvasPanel({
  editingCount,
  previewId,
  onHide,
}: {
  editingCount: number;
  previewId: string;
  onHide: () => void;
}) {
  return (
    <section className={cn(surface, "relative flex min-h-0 flex-col")}>
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Share2 size={15} className="text-sky-400" />
        <div>
          <h2 className="text-sm font-semibold">Live Shared Mind Map</h2>
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {editingCount} Editing
          </p>
        </div>
        <button
          type="button"
          onClick={onHide}
          className={cn(softButton, "ml-auto")}
        >
          <PanelRightClose size={13} />
          Sembunyikan Kanvas
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {previewId ? (
          <DocumentPreview key={previewId} id={previewId} />
        ) : (
          <MindMapPlaceholder />
        )}

        <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-xl border border-white/10 bg-[#0d1521]/90 p-1.5">
          {[
            { key: "add", Icon: Plus },
            { key: "link", Icon: Link2 },
            { key: "export", Icon: Download },
          ].map(({ key, Icon }) => (
            <span
              key={key}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40"
            >
              <Icon size={15} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MindMapPlaceholder() {
  return (
    <div className="absolute inset-0">
      <svg
        className="h-full w-full"
        viewBox="0 0 480 520"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <title>Pratinjau mind map</title>
        <line
          x1="250"
          y1="140"
          x2="400"
          y2="360"
          stroke="rgba(56,189,248,0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <line
          x1="250"
          y1="150"
          x2="150"
          y2="120"
          stroke="rgba(56,189,248,0.25)"
          strokeWidth="1.5"
        />
        <line
          x1="330"
          y1="330"
          x2="410"
          y2="430"
          stroke="rgba(56,189,248,0.3)"
          strokeWidth="1.5"
        />
      </svg>
      <PlaceholderNode
        className="left-[24%] top-[20%]"
        label="Database Nodes"
      />
      <PlaceholderNode
        className="left-[52%] top-[54%]"
        label="Sistem Terdistribusi"
        caption="Core Architecture"
        primary
      />
      <PlaceholderNode
        className="right-[6%] bottom-[14%]"
        label="Security / Encryption"
      />
      <p className="absolute bottom-4 left-4 max-w-[60%] text-[11px] text-white/35">
        Pratinjau statis. Kanvas kolaboratif real-time menyusul setelah chat
        stabil.
      </p>
    </div>
  );
}

function PlaceholderNode({
  className,
  label,
  caption,
  primary,
}: {
  className?: string;
  label: string;
  caption?: string;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute rounded-lg border px-3 py-2 text-xs shadow-lg",
        primary
          ? "border-sky-500/60 bg-sky-500/10 text-white"
          : "border-white/15 bg-[#0d1521] text-white/80",
        className,
      )}
    >
      {label}
      {caption && (
        <span className="mt-0.5 block text-[10px] text-white/45">
          {caption}
        </span>
      )}
    </div>
  );
}

function DocumentPreview({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
    retry: false,
  });
  return (
    <div className="h-full space-y-3 overflow-y-auto p-5">
      {query.isPending && (
        <output className="text-sm text-white/55">Memuat mind map…</output>
      )}
      {query.error && (
        <ErrorNotice message={getDocumentErrorMessage(query.error)} />
      )}
      {query.data && (
        <>
          <h3 className="text-sm font-semibold">{query.data.data.title}</h3>
          <p className="text-xs text-white/65">{query.data.data.summary}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-white/80">
            {query.data.data.key_points.map((point, index) => (
              <li key={index + point}>{point}</li>
            ))}
          </ul>
          <Link
            href={`/ppt-canvas?documentId=${encodeURIComponent(id)}`}
            className="inline-block text-xs text-sky-300 underline"
          >
            Buka kanvas lengkap
          </Link>
        </>
      )}
    </div>
  );
}

function ErrorNotice({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200",
        className,
      )}
    >
      {message}
    </p>
  );
}

function isMine(message: ChatMessage, meId: string) {
  if (message.pending) return true;
  return Boolean(meId) && message.senderId === meId;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortCode(id: string) {
  const tail = id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-4)
    .toUpperCase();
  return tail ? `EQL-${tail}` : "EQL";
}
