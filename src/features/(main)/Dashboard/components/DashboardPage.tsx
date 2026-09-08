"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useDeleteHistory, useHistory } from "../hooks/useHistory";
import { getHistoryErrorMessage } from "../service/history";
import type { HistoryCounts } from "../type/dashboard.type";
import { HistoryCard } from "./HistoryCard";
import { StatBadges } from "./StatBadges";

const EMPTY_COUNTS: HistoryCounts = {
  total_summaries: 0,
  total_stt: 0,
  total_tts: 0,
  total_all: 0,
};

export default function DashboardPage() {
  const history = useHistory();
  const remove = useDeleteHistory();

  const records = history.data?.records ?? [];
  const counts = history.data?.counts ?? EMPTY_COUNTS;

  const handleDelete = (id: string, title: string) => {
    remove.mutate(id, {
      onSuccess: () => toast.success(`"${title}" dihapus dari riwayat.`),
      onError: (error) =>
        toast.error(getHistoryErrorMessage(error, "Gagal menghapus riwayat.")),
    });
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl leading-tight text-white sm:text-[28px]">
            Selamat Datang Kembali
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Kelola dan akses kembali seluruh riwayat pembelajaran inklusif Anda.
          </p>
        </div>
        <StatBadges counts={counts} />
      </div>

      {history.isPending && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/40">
          <LoaderCircle className="size-4 animate-spin" />
          Memuat riwayat…
        </div>
      )}

      {history.isError && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
          <p className="text-sm text-app-danger">
            {getHistoryErrorMessage(history.error)}
          </p>
          <button
            type="button"
            onClick={() => void history.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-xs text-white/80 transition-colors hover:bg-white/5"
          >
            <RefreshCw className="size-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      {history.isSuccess && records.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-sm text-white/40">
            Belum ada riwayat. Ringkasan dokumen, transkrip, dan narasi audio
            Anda akan muncul di sini.
          </p>
        </div>
      )}

      {records.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              deleting={remove.isPending && remove.variables === record.id}
              onDelete={() => handleDelete(record.id, record.title)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
