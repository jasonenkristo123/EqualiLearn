import { AudioLines, FileText, Layers, Presentation } from "lucide-react";
import type { HistoryCounts } from "../type/dashboard.type";

export function StatBadges({ counts }: { counts: HistoryCounts }) {
  const stats = [
    { label: "Dokumen", value: counts.total_summaries, icon: FileText },
    { label: "Transkrip", value: counts.total_stt, icon: AudioLines },
    { label: "Narasi", value: counts.total_tts, icon: Presentation },
    { label: "Total", value: counts.total_all, icon: Layers },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-3 shadow-sm sm:min-w-[104px]"
        >
          <Icon className="size-4 shrink-0 text-white/75" />
          <p className="truncate text-xs text-white/70">
            <span className="font-inter-600 text-white">{value}</span> {label}
          </p>
        </div>
      ))}
    </div>
  );
}
