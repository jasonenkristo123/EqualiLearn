import { AudioLines } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../service/groups";
import {
  documentIdFromMessage,
  formatClock,
  type Mode,
} from "../util/discussion";
import { softButton } from "../util/styles";

export function MessageBubble({
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
  const documentId = documentIdFromMessage(message.content);
  const clock = formatClock(message.createdAt);

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
            ? "rounded-br-md bg-sky-600 text-static-white"
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
        <div className="flex items-center gap-2 px-1 text-[11px] text-app-accent/80">
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
