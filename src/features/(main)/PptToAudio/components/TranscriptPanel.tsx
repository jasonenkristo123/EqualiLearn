import { ScrollText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TranscriptParagraph } from "../type/ppt-audio.type";
import { Panel, PanelHeader } from "./Panel";
import { EmptyState, LoadingState } from "./Placeholders";

export function TranscriptPanel({
  loading,
  paragraphs,
  activeId,
  onSeek,
}: {
  loading: boolean;
  paragraphs: TranscriptParagraph[];
  activeId: string;
  onSeek: (paragraph: TranscriptParagraph) => void;
}) {
  return (
    <Panel className="min-h-[420px] lg:min-h-0 lg:flex-1">
      <PanelHeader
        icon={ScrollText}
        title="Transkrip tersinkronisasi"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-inter-500 text-xs text-app-teal">
            <Zap className="size-3" />
            Live Sync
          </span>
        }
      />
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {loading && <LoadingState />}
        {!loading && paragraphs.length === 0 && (
          <EmptyState message="Teks dokumen akan ditampilkan di sini." />
        )}
        {paragraphs.map((paragraph) => {
          const active = paragraph.id === activeId;
          return (
            <button
              key={paragraph.id}
              type="button"
              onClick={() => onSeek(paragraph)}
              className={cn(
                "relative block w-full pl-4 text-left text-sm leading-relaxed transition-colors",
                active
                  ? "border-l-2 border-sky-400 text-white"
                  : "text-white/55 hover:text-white/80",
              )}
            >
              {active && (
                <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-sky-400" />
              )}
              {paragraph.text}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
