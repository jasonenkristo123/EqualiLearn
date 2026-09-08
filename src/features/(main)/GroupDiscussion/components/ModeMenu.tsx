import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MODE_LABEL, type Mode } from "../util/discussion";
import { softButton } from "../util/styles";

export function ModeMenu({
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
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-white/15 bg-app-surface py-1 text-xs shadow-xl"
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
                  value === mode && "text-app-accent",
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
