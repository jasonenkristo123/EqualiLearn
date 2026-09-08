"use client";

import {
  AudioLines,
  BookOpen,
  Clock3,
  ExternalLink,
  FileText,
  Network,
  PencilRuler,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type HistoryCategory = "transcript" | "reader" | "canvas" | "circle";
type HistoryFilter = "all" | HistoryCategory;

interface HistoryItem {
  id: string;
  category: HistoryCategory;
  title: string;
  description: string;
  dateLabel: string;
  meta: string;
  href: string;
}

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "Semua Riwayat" },
  { id: "transcript", label: "Transkrip" },
  { id: "reader", label: "PPT Reader" },
  { id: "canvas", label: "Kanvas Pikir" },
  { id: "circle", label: "Ruang Lingkar" },
];

const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: "history-1",
    category: "transcript",
    title: "Sistem Terdistribusi - Pertemuan 4",
    description:
      "Transkrip audio perkuliahan membahas arsitektur client-server dan peer-to-peer.",
    dateLabel: "2 hari lalu",
    meta: "45 Min",
    href: "/live-transcribe",
  },
  {
    id: "history-2",
    category: "reader",
    title: "Materi_Jaringan_Komputer.pdf",
    description:
      "Dokumen presentasi dengan anotasi yang dibaca hingga halaman 14.",
    dateLabel: "Kemarin",
    meta: "Hal 14/32",
    href: "/ppt-audio",
  },
  {
    id: "history-3",
    category: "canvas",
    title: "Distributed Systems Topology",
    description:
      "Peta konsep visual yang menggambarkan hubungan antar node dalam sistem tersebar.",
    dateLabel: "1 minggu lalu",
    meta: "12 Nodes",
    href: "/ppt-canvas",
  },
  {
    id: "history-4",
    category: "circle",
    title: "Kelompok 3 - System Design",
    description:
      "Ruang kolaborasi diskusi tugas akhir mengenai perancangan sistem.",
    dateLabel: "10 Okt 2023",
    meta: "4 Anggota",
    href: "/canvas-discussion",
  },
];

const CATEGORY_META: Record<
  HistoryCategory,
  {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    metaIcon: ComponentType<SVGProps<SVGSVGElement>>;
    accent: string;
  }
> = {
  transcript: { icon: AudioLines, metaIcon: Clock3, accent: "bg-sky-400" },
  reader: { icon: BookOpen, metaIcon: BookOpen, accent: "bg-transparent" },
  canvas: { icon: PencilRuler, metaIcon: Network, accent: "bg-transparent" },
  circle: { icon: Users, metaIcon: Users, accent: "bg-transparent" },
};

const STATS = [
  { label: "Transkrip", value: 12, icon: AudioLines },
  { label: "Dokumen", value: 5, icon: FileText },
  { label: "Kanvas", value: 8, icon: PencilRuler },
];

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const [history, setHistory] = useState(HISTORY_ITEMS);

  const visibleHistory = history.filter(
    (item) => activeFilter === "all" || item.category === activeFilter,
  );

  const removeHistory = (id: string) => {
    setHistory((items) => items.filter((item) => item.id !== id));
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl leading-tight text-white sm:text-[28px]">
            Selamat Datang Kembali, Alex
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Kelola dan akses kembali seluruh riwayat pembelajaran inklusif Anda.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0 sm:gap-3">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-3 shadow-sm sm:min-w-[118px]"
            >
              <Icon className="size-4 shrink-0 text-white/75" />
              <p className="truncate text-xs text-white/70">
                <span className="font-inter-600 text-white">{value}</span>{" "}
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter riwayat pembelajaran"
        className="no-scrollbar mt-8 flex max-w-max gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025] p-1.5"
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "shrink-0 rounded-md px-4 py-2 text-xs transition-colors",
              activeFilter === filter.id
                ? "bg-white font-inter-600 text-app-background shadow-sm"
                : "text-white/45 hover:bg-white/5 hover:text-white/75",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleHistory.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onDelete={() => removeHistory(item.id)}
          />
        ))}
      </div>

      {visibleHistory.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-sm text-white/40">
            Belum ada riwayat dalam kategori ini.
          </p>
        </div>
      )}
    </section>
  );
}

function HistoryCard({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: () => void;
}) {
  const {
    icon: Icon,
    metaIcon: MetaIcon,
    accent,
  } = CATEGORY_META[item.category];

  return (
    <article className="group relative flex min-h-[205px] flex-col overflow-hidden rounded-xl border border-white/10 bg-app-surface/55 transition-colors hover:border-white/20">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-[3px]", accent)}
      />

      <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-10 place-items-center rounded-md border border-white/10 bg-white/[0.015]">
            <Icon className="size-5 text-white/90" />
          </span>
          <time className="pt-1 font-inter-500 text-[10px] uppercase tracking-wide text-white/40">
            {item.dateLabel}
          </time>
        </div>

        <h2 className="mt-4 font-inter-500 text-sm text-white">{item.title}</h2>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">
          {item.description}
        </p>
      </div>

      <footer className="flex items-center justify-between border-t border-white/10 px-5 py-4">
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <MetaIcon className="size-3.5" />
          {item.meta}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Hapus ${item.title}`}
            className="grid size-8 place-items-center rounded-md text-white/35 transition-colors hover:bg-red-400/10 hover:text-app-danger"
          >
            <Trash2 className="size-4" />
          </button>
          <Link
            href={item.href}
            aria-label={`Buka ${item.title}`}
            className="grid size-8 place-items-center rounded-md text-white/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="size-4" />
          </Link>
        </div>
      </footer>
    </article>
  );
}
