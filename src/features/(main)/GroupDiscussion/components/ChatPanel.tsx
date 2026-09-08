import {
  ArrowLeft,
  Check,
  Copy,
  Mic,
  PanelRightOpen,
  Send,
  Share2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getDocumentErrorMessage } from "@/shared/api/documents";
import type { ChatGroup, ChatMessage } from "../service/groups";
import {
  type ChatState,
  type HistoryLike,
  isMine,
  type Mode,
  shortCode,
} from "../util/discussion";
import { softButton, surface } from "../util/styles";
import { AvatarStack } from "./AvatarStack";
import { ConnectionBar } from "./ConnectionBar";
import { ErrorNotice } from "./ErrorNotice";
import { InvitePanel } from "./InvitePanel";
import { MessageBubble } from "./MessageBubble";
import { ModeMenu } from "./ModeMenu";
import { ShareDocument } from "./ShareDocument";

export function ChatPanel({
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
          className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-app-accent transition hover:bg-sky-500/25"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600/90 px-2.5 py-1.5 text-xs font-semibold text-static-white transition hover:bg-sky-500"
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

      <ConnectionBar chat={chat} />

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

      <div className="border-t border-white/10 p-3">
        {error && <ErrorNotice message={error} className="mb-2" />}
        <div className="flex items-end gap-2 rounded-xl border border-white/15 bg-app-field px-3 py-2">
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
            className="rounded-lg bg-sky-600 p-2 text-static-white transition hover:bg-sky-500 disabled:opacity-40"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-app-accent transition hover:bg-sky-500/20"
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
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-app-surface-muted px-2.5 py-1.5 text-xs text-white/80 shadow-lg transition hover:bg-white/10"
        >
          <PanelRightOpen size={13} />
          Tampilkan Kanvas
        </button>
      )}
    </section>
  );
}
