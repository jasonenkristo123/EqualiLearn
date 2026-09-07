"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getDocument, getDocumentErrorMessage } from "@/shared/api/documents";
import { useGroupChat } from "../hooks/useGroupChat";
import {
  addMember,
  type ChatMessage,
  createGroup,
  getGroup,
  getMessages,
  groupKeys,
  listGroups,
  removeMember,
} from "../service/groups";

const field =
  "w-full rounded-lg border border-white/20 bg-[#0b1220] px-3 py-2 text-sm text-white placeholder:text-white/45";
const button =
  "rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45";
type Mode = "standard" | "focus" | "read-aloud";

export default function CanvasDiscussion({
  initialGroupId = "",
  initialDocumentId = "",
}: {
  initialGroupId?: string;
  initialDocumentId?: string;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const groups = useInfiniteQuery({
    queryKey: groupKeys.lists,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listGroups(pageParam),
    getNextPageParam: (page, pages) =>
      page.hasMore ? pages.length + 1 : undefined,
    retry: false,
  });
  const create = useMutation({ mutationFn: createGroup });
  const rooms = [
    ...new Map(
      groups.data?.pages
        .flatMap((page) => page.items)
        .map((group) => [group.id, group]),
    ).values(),
  ];

  const selectGroup = (id: string) => {
    const params = new URLSearchParams({ groupId: id });
    if (initialDocumentId) params.set("documentId", initialDocumentId);
    router.push("/canvas-discussion?" + params);
  };

  const submitGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    const emails = [
      ...new Set(
        String(values.get("emails") ?? "")
          .split(/[,;\s]+/)
          .filter(Boolean),
      ),
    ];
    if (!name) return;
    if (emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError("Periksa alamat email anggota.");
      return;
    }
    setError("");
    try {
      const room = await create.mutateAsync({
        name,
        description: String(values.get("description") ?? "").trim(),
        member_emails: emails,
        member_user_ids: [],
      });
      client.setQueryData(groupKeys.detail(room.id), room);
      void client.invalidateQueries({ queryKey: groupKeys.lists });
      setCreating(false);
      selectGroup(room.id);
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <div className="space-y-4 p-4 text-white lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Ruang Lingkar</h1>
          <p className="text-sm text-white/65">
            Diskusikan materi dan bagikan mind map bersama kelompok.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={button}
            type="button"
            onClick={() => setCreating(!creating)}
          >
            Buat grup
          </button>
          <button
            className={button}
            type="button"
            disabled
            title="Fitur bergabung dengan kode belum tersedia"
          >
            Gabung grup · Segera hadir
          </button>
        </div>
      </header>
      <p className="text-xs text-white/60">
        Untuk bergabung saat ini, minta anggota grup menambahkan email Anda.
      </p>
      {creating && (
        <form
          onSubmit={submitGroup}
          className="grid max-w-xl gap-3 rounded-xl border border-white/15 p-4"
        >
          <h2>Buat grup belajar</h2>
          <label className="text-sm">
            Nama grup
            <input required maxLength={120} name="name" className={field} />
          </label>
          <label className="text-sm">
            Deskripsi
            <textarea name="description" maxLength={2000} className={field} />
          </label>
          <label className="text-sm">
            Email anggota (opsional)
            <textarea
              name="emails"
              placeholder="bob@example.com, charlie@example.com"
              className={field}
            />
          </label>
          <p className="text-xs text-white/65">
            Pisahkan alamat email dengan koma atau baris baru.
          </p>
          {error && <ErrorNotice message={error} />}
          <button className={button} disabled={create.isPending} type="submit">
            {create.isPending ? "Membuat grup…" : "Buat"}
          </button>
        </form>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label="Grup Anda"
          className="space-y-2 rounded-xl border border-white/15 p-3"
        >
          <div className="flex items-center justify-between">
            <h2>Grup Anda</h2>
            <button
              type="button"
              className={button}
              disabled={groups.isFetching}
              onClick={() => void groups.refetch()}
            >
              Muat ulang
            </button>
          </div>
          {groups.isPending && <output>Memuat grup…</output>}
          {groups.error && (
            <ErrorNotice message={getDocumentErrorMessage(groups.error)} />
          )}
          {groups.isSuccess && rooms.length === 0 && (
            <p className="py-6 text-sm text-white/65">
              Belum ada grup. Buat grup pertama Anda atau minta undangan melalui
              email.
            </p>
          )}
          {rooms.map((room) => (
            <button
              type="button"
              key={room.id}
              aria-pressed={room.id === initialGroupId}
              onClick={() => selectGroup(room.id)}
              className={cn(
                "w-full rounded-lg p-3 text-left text-sm",
                room.id === initialGroupId
                  ? "bg-sky-500/20 ring-1 ring-sky-400"
                  : "bg-white/5 hover:bg-white/10",
              )}
            >
              {room.name}
            </button>
          ))}
          {groups.hasNextPage && (
            <button
              type="button"
              className={button}
              disabled={groups.isFetchingNextPage}
              onClick={() => void groups.fetchNextPage()}
            >
              Grup lainnya
            </button>
          )}
        </nav>
        {initialGroupId ? (
          <GroupRoom
            key={initialGroupId}
            id={initialGroupId}
            documentId={initialDocumentId}
          />
        ) : (
          <section className="rounded-xl border border-dashed border-white/20 px-6 py-20 text-center">
            <h2 className="text-lg">Pilih atau buat ruang diskusi</h2>
            <p className="mt-2 text-sm text-white/65">
              Pesan dan mind map kelompok akan tampil di sini.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function GroupRoom({ id, documentId }: { id: string; documentId: string }) {
  const client = useQueryClient();
  const room = useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => getGroup(id),
    retry: false,
  });
  const history = useInfiniteQuery({
    queryKey: groupKeys.messages(id),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getMessages(id, pageParam),
    getNextPageParam: (page, pages) =>
      page.hasMore ? pages.length + 1 : undefined,
    enabled: room.isSuccess,
    retry: false,
    refetchInterval: 15000,
  });
  const chat = useGroupChat(id);
  const [mode, setMode] = useState<Mode>("standard");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [removing, setRemoving] = useState("");
  const [previewId, setPreviewId] = useState(documentId);
  const invite = useMutation({
    mutationFn: (email: string) => addMember(id, email),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeMember(id, userId),
  });
  const messages = [
    ...new Map(
      history.data?.pages
        .flatMap((page) => page.items)
        .filter((message) => message.groupId === id)
        .map((message) => [message.id, message]),
    ).values(),
  ].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("equalilearn-discussion-mode");
      if (saved === "standard" || saved === "focus" || saved === "read-aloud")
        setMode(saved);
    } catch {
      /* Preferences remain usable without storage. */
    }
    return () => window.speechSynthesis?.cancel();
  }, []);

  const changeMode = (value: Mode) => {
    setMode(value);
    window.speechSynthesis?.cancel();
    try {
      localStorage.setItem("equalilearn-discussion-mode", value);
    } catch {
      /* Optional preference. */
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setError("");
    try {
      chat.send(draft.trim());
      setNotice(
        "Pesan dikirim ke koneksi. Pesan akan tampil setelah tersimpan di riwayat grup.",
      );
      // Keep the draft: socket.send alone does not acknowledge delivery.
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  const updateMembers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    setError("");
    try {
      await invite.mutateAsync(email);
      await client.invalidateQueries({ queryKey: groupKeys.detail(id) });
      form.reset();
      setNotice("Anggota ditambahkan.");
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  const confirmRemove = async () => {
    setError("");
    try {
      await remove.mutateAsync(removing);
      setRemoving("");
      await client.invalidateQueries({ queryKey: groupKeys.detail(id) });
      void client.invalidateQueries({ queryKey: groupKeys.lists });
      setNotice("Anggota dikeluarkan dari grup.");
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  if (room.isPending) return <output>Memuat ruang diskusi…</output>;
  if (room.isError)
    return (
      <div>
        <ErrorNotice message={getDocumentErrorMessage(room.error)} />
        <button
          type="button"
          className={button}
          onClick={() => void room.refetch()}
        >
          Coba lagi
        </button>
      </div>
    );

  return (
    <section className="min-w-0 space-y-4">
      <header className="space-y-3 rounded-xl border border-white/15 p-4">
        <h2 className="text-lg">{room.data.name}</h2>
        {room.data.description && (
          <p className="text-sm text-white/65">{room.data.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={button}
            onClick={() => setShowMembers(!showMembers)}
            aria-expanded={showMembers}
          >
            Kelola anggota
          </button>
          <label className="text-sm">
            Tampilan saya{" "}
            <select
              className={field}
              value={mode}
              onChange={(event) => changeMode(event.target.value as Mode)}
            >
              <option value="standard">Standar</option>
              <option value="focus">Fokus · teks lebih besar</option>
              <option value="read-aloud">Baca pesan dengan suara</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-white/65">
          {mode === "focus"
            ? "Teks diperbesar dan pratinjau kanvas disembunyikan agar lebih mudah fokus."
            : mode === "read-aloud"
              ? "Gunakan tombol Baca pada pesan. Suara tersedia sesuai dukungan browser Anda."
              : "Pesan teks dan pratinjau mind map ditampilkan bersama."}{" "}
          Preferensi ini hanya berlaku untuk Anda.
        </p>
      </header>
      {error && <ErrorNotice message={error} />}
      {notice && (
        <output className="block text-sm text-sky-200">{notice}</output>
      )}
      {showMembers && (
        <div className="space-y-3 rounded-xl border border-white/15 p-4">
          <h3>Anggota grup</h3>
          {!room.data.members.length && (
            <p className="text-sm text-white/65">
              Belum ada informasi anggota pada respons grup.
            </p>
          )}
          <ul className="space-y-2">
            {room.data.members.map((member, index) => (
              <li
                key={member.userId || member.email + index}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {member.name || member.email || "Anggota"} · {member.role}
                </span>
                <button
                  type="button"
                  className={button}
                  disabled={!member.userId || remove.isPending}
                  onClick={() => setRemoving(member.userId)}
                >
                  Keluarkan
                </button>
              </li>
            ))}
          </ul>
          {removing && (
            <fieldset
              className="space-x-2"
              aria-label="Konfirmasi mengeluarkan anggota"
            >
              <p className="mb-2 text-sm">Keluarkan anggota ini dari grup?</p>
              <button
                className={button}
                type="button"
                disabled={remove.isPending}
                onClick={() => void confirmRemove()}
              >
                Ya, keluarkan
              </button>
              <button
                className={button}
                type="button"
                disabled={remove.isPending}
                onClick={() => setRemoving("")}
              >
                Batal
              </button>
            </fieldset>
          )}
          <form onSubmit={updateMembers} className="flex flex-wrap gap-2">
            <label className="flex-1 text-sm">
              Email anggota baru
              <input className={field} name="email" type="email" required />
            </label>
            <button
              className={button}
              type="submit"
              disabled={invite.isPending}
            >
              {invite.isPending ? "Menambahkan…" : "Tambah anggota"}
            </button>
          </form>
        </div>
      )}
      <div
        className={cn(
          "grid gap-4",
          mode !== "focus" && "xl:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <div className="min-w-0 rounded-xl border border-white/15">
          <div className="space-y-2 border-b border-white/15 p-3 text-sm">
            <output>
              {chat.status === "unconfigured"
                ? "Pengiriman chat belum tersedia. Riwayat diperbarui setiap 15 detik."
                : chat.status === "connected"
                  ? "Chat tersambung"
                  : chat.status === "connecting"
                    ? "Menyambungkan chat…"
                    : chat.status === "authentication-required"
                      ? "Masuk kembali untuk menghubungkan chat."
                      : "Chat terputus. Draf Anda tetap tersedia."}
            </output>
            {chat.error && <ErrorNotice message={chat.error} />}
            {chat.status === "disconnected" && (
              <button className={button} type="button" onClick={chat.reconnect}>
                Sambungkan kembali
              </button>
            )}
          </div>
          <div
            role="log"
            aria-label="Pesan grup"
            aria-live="polite"
            aria-relevant="additions"
            className="h-[420px] space-y-4 overflow-y-auto p-4"
          >
            {history.isPending && <output>Memuat riwayat…</output>}
            {history.error && (
              <div>
                <ErrorNotice message={getDocumentErrorMessage(history.error)} />
                <button
                  type="button"
                  className={button}
                  onClick={() => void history.refetch()}
                >
                  Coba lagi
                </button>
              </div>
            )}
            {history.hasNextPage && (
              <button
                className={button}
                type="button"
                disabled={history.isFetchingNextPage}
                onClick={() => void history.fetchNextPage()}
              >
                Muat pesan lainnya
              </button>
            )}
            {history.isSuccess && !messages.length && (
              <p className="text-sm text-white/65">
                Belum ada pesan di grup ini.
              </p>
            )}
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                mode={mode}
                onPreview={setPreviewId}
                onError={setError}
              />
            ))}
          </div>
          <form
            onSubmit={submit}
            className="space-y-2 border-t border-white/15 p-3"
          >
            <label className="block text-sm">
              Pesan
              <textarea
                className={field}
                value={draft}
                maxLength={4000}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setNotice("");
                }}
                placeholder="Ketik pesan…"
              />
            </label>
            <button
              className={button}
              type="submit"
              disabled={chat.status !== "connected" || !draft.trim()}
            >
              Kirim pesan
            </button>
          </form>
        </div>
        <div className="space-y-4">
          <ShareDocument
            initialId={documentId}
            onPrepare={(docId, title) => {
              setPreviewId(docId);
              setDraft(
                "Mind map: " +
                  title +
                  "\n" +
                  window.location.origin +
                  "/ppt-canvas?documentId=" +
                  encodeURIComponent(docId),
              );
              setNotice("Tautan dimasukkan ke draf. Kirim saat chat tersedia.");
            }}
          />
          {mode !== "focus" && previewId && (
            <DocumentPreview key={previewId} id={previewId} />
          )}
        </div>
      </div>
    </section>
  );
}

function Message({
  message,
  mode,
  onPreview,
  onError,
}: {
  message: ChatMessage;
  mode: Mode;
  onPreview: (id: string) => void;
  onError: (error: string) => void;
}) {
  const documentId = message.content.match(
    /\/ppt-canvas\?documentId=([a-zA-Z0-9-]+)/,
  )?.[1];
  const timestamp = new Date(message.createdAt);
  const read = () => {
    if (!("speechSynthesis" in window)) {
      onError("Browser ini belum mendukung pembacaan suara.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "id-ID";
    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled")
        onError("Pesan tidak dapat dibacakan. Coba suara atau browser lain.");
    };
    window.speechSynthesis.speak(utterance);
  };
  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="mb-2 text-xs text-white/65">
        {message.author}{" "}
        {Number.isNaN(timestamp.getTime())
          ? ""
          : "· " + timestamp.toLocaleString("id-ID")}
      </p>
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-white/90",
          mode === "focus"
            ? "text-lg leading-loose"
            : "text-sm leading-relaxed",
        )}
      >
        {message.content}
      </p>
      {documentId && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            className={button}
            href={"/ppt-canvas?documentId=" + documentId}
          >
            Buka mind map
          </Link>
          <button
            className={button}
            type="button"
            onClick={() => onPreview(documentId)}
          >
            Pratinjau
          </button>
        </div>
      )}
      {mode === "read-aloud" && (
        <div className="mt-2 flex gap-2">
          <button className={button} type="button" onClick={read}>
            Baca pesan
          </button>
          <button
            className={button}
            type="button"
            onClick={() => window.speechSynthesis?.cancel()}
          >
            Hentikan suara
          </button>
        </div>
      )}
    </article>
  );
}

function ShareDocument({
  initialId,
  onPrepare,
}: {
  initialId: string;
  onPrepare: (id: string, title: string) => void;
}) {
  const [value, setValue] = useState(initialId);
  const [error, setError] = useState("");
  const load = useMutation({ mutationFn: getDocument });
  const prepare = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const id = value.includes("?")
        ? new URL(value, window.location.origin).searchParams.get("documentId")
        : value.trim();
      if (!id || !/^[a-zA-Z0-9-]+$/.test(id))
        throw new Error("Tempel tautan mind map atau ID dokumen yang valid.");
      const response = await load.mutateAsync(id);
      onPrepare(
        response.data.id,
        response.data.title || response.data.file_name,
      );
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };
  return (
    <form
      onSubmit={prepare}
      className="space-y-3 rounded-xl border border-white/15 p-4"
    >
      <h3>Bagikan mind map</h3>
      <p className="text-xs text-white/65">
        Salin tautan dari Kanvas Pikir, lalu tempel di sini. Anggota dapat
        membuka peta yang dibuat dari dokumen tersimpan. Perubahan node lokal
        belum ikut tersimpan.
      </p>
      <label className="block text-sm">
        Tautan atau ID dokumen
        <input
          required
          className={field}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <button className={button} disabled={load.isPending} type="submit">
        {load.isPending ? "Memeriksa dokumen…" : "Tambahkan tautan ke draf"}
      </button>
      <Link className="block text-sm text-sky-300 underline" href="/ppt-canvas">
        Buka Kanvas Pikir
      </Link>
    </form>
  );
}

function DocumentPreview({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
    retry: false,
  });
  return (
    <aside
      className="space-y-3 rounded-xl border border-white/15 p-4"
      aria-label="Pratinjau materi mind map"
    >
      {query.isPending && <output>Memuat mind map…</output>}
      {query.error && (
        <ErrorNotice message={getDocumentErrorMessage(query.error)} />
      )}
      {query.data && (
        <>
          <h3>{query.data.data.title}</h3>
          <p className="text-sm text-white/70">{query.data.data.summary}</p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {query.data.data.key_points.map((point, index) => (
              <li key={String(index) + point}>{point}</li>
            ))}
          </ul>
          <Link
            className="block text-sky-300 underline"
            href={"/ppt-canvas?documentId=" + encodeURIComponent(id)}
          >
            Buka kanvas lengkap
          </Link>
        </>
      )}
    </aside>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200"
    >
      {message}
    </p>
  );
}
