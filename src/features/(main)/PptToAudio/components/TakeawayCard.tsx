import { cn } from "@/lib/utils";
import type { Takeaway } from "../type/ppt-audio.type";

export function TakeawayCard({
  takeaway,
  active,
  onClick,
}: {
  takeaway: Takeaway;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "block w-full rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-white/25 bg-white/[0.05]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <h3 className="font-inter-600 text-sm text-white">{takeaway.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-white/50">
        {takeaway.summary}
      </p>
      {takeaway.tags && takeaway.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {takeaway.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
