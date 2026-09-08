import { cn } from "@/lib/utils";
import { WAVE_BARS } from "../util/format";

export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden="true">
      {WAVE_BARS.map((bar, i) => (
        <span
          key={bar.id}
          className={cn(
            "w-[3px] rounded-full bg-sky-400",
            active ? "motion-safe:animate-pulse" : "opacity-30",
          )}
          style={{
            height: active
              ? bar.height
              : Math.max(4, Math.round(bar.height / 3)),
            animationDelay: `${(i % 10) * 90}ms`,
            animationDuration: `${900 + (i % 5) * 160}ms`,
          }}
        />
      ))}
    </div>
  );
}
