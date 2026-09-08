import { Sparkles } from "lucide-react";
import type { Takeaway } from "../type/ppt-audio.type";
import { Panel, PanelHeader } from "./Panel";
import { EmptyState, LoadingState } from "./Placeholders";
import { TakeawayCard } from "./TakeawayCard";

export function TakeawaysPanel({
  loading,
  takeaways,
  activeId,
  onSelect,
}: {
  loading: boolean;
  takeaways: Takeaway[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Panel className="min-h-[420px] lg:min-h-0 lg:w-[340px] lg:shrink-0">
      <PanelHeader icon={Sparkles} title="AI Key Takeaways" />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && <LoadingState />}
        {!loading && takeaways.length === 0 && (
          <EmptyState message="Key takeaways akan muncul setelah dokumen selesai diringkas." />
        )}
        {takeaways.map((takeaway) => (
          <TakeawayCard
            key={takeaway.id}
            takeaway={takeaway}
            active={takeaway.id === activeId}
            onClick={() => onSelect(takeaway.id)}
          />
        ))}
      </div>
    </Panel>
  );
}
