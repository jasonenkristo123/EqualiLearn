import { RefreshCw } from "lucide-react";
import type { ChatState } from "../util/discussion";

export function ConnectionBar({ chat }: { chat: ChatState }) {
  const label =
    chat.status === "connected"
      ? "Chat tersambung"
      : chat.status === "connecting"
        ? "Menyambungkan chat…"
        : chat.status === "authentication-required"
          ? "Sesi berakhir. Masuk kembali untuk mengirim pesan."
          : chat.status === "unconfigured"
            ? "Pengiriman real-time belum tersedia. Riwayat diperbarui tiap 15 detik."
            : "Chat terputus. Draf Anda tetap tersimpan.";
  const tone =
    chat.status === "connected"
      ? "text-app-success"
      : chat.status === "connecting"
        ? "text-white/50"
        : "text-app-warning";

  if (chat.status === "connected" && !chat.error) return null;

  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-1.5 text-[11px]">
      <span className={tone}>{label}</span>
      {chat.error && (
        <button
          type="button"
          className="text-app-warning underline"
          onClick={chat.clearError}
        >
          tutup
        </button>
      )}
      {chat.status === "disconnected" && (
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 text-app-accent underline"
          onClick={chat.reconnect}
        >
          <RefreshCw size={11} />
          Sambungkan kembali
        </button>
      )}
    </div>
  );
}
