import { FileText, Hash, ListChecks, MapPin, Zap } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";
import type { ActionItem, SummaryData } from "../type/speech-to-text.type";
import { FooterButton } from "./FooterButton";
import { Panel } from "./Panel";

export function SummaryPane({
  summary,
  actionItems,
  onToggleActionItem,
  onGenerateSummary,
  onExport,
}: {
  summary: SummaryData;
  actionItems: ActionItem[];
  onToggleActionItem: (id: string) => void;
  onGenerateSummary?: () => void;
  onExport?: () => void;
}) {
  return (
    <Panel className="min-h-[560px] lg:min-h-0 lg:flex-[6]">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-white">Ringkasan AI</h2>
            <p className="mt-1 text-sm text-white/50">
              Sintesis cerdas dari percakapan berjalan
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-inter-500 text-xs text-app-teal">
            <Zap className="size-3" />
            Realtime AI
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <button
            type="button"
            onClick={onGenerateSummary}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 font-inter-600 text-sm text-app-background transition-colors hover:bg-white/90"
          >
            <Zap className="size-4" />
            Ringkas Transkrip Sekarang
          </button>
        </div>

        <Section icon={MapPin} title="Key Takeaways">
          <ul className="space-y-2.5">
            {summary.takeaways.map((takeaway) => (
              <li
                key={takeaway}
                className="flex gap-2.5 text-sm leading-relaxed text-white/70"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400" />
                {takeaway}
              </li>
            ))}
          </ul>
        </Section>

        <Divider />

        <Section icon={Hash} title="Key Terms">
          <div className="flex flex-wrap gap-2">
            {summary.keyTerms.map((term) => (
              <span
                key={term}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/60"
              >
                {term}
              </span>
            ))}
          </div>
        </Section>

        <Divider />

        <Section icon={ListChecks} title="Action Items">
          <ul className="space-y-3">
            {actionItems.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/70">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggleActionItem(item.id)}
                    className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-white/5 accent-cyan"
                  />
                  <span
                    className={cn(item.done && "text-white/40 line-through")}
                  >
                    {item.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <footer className="border-t border-white/10 p-3">
        <FooterButton icon={FileText} onClick={onExport}>
          Ekspor Ringkasan PDF/Text
        </FooterButton>
      </footer>
    </Panel>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-6 py-5">
      <h3 className="mb-3 flex items-center gap-2 font-inter-600 text-[11px] uppercase tracking-wider text-white/40">
        <Icon className="size-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Divider() {
  return <div className="mx-6 border-t border-white/[0.06]" />;
}
