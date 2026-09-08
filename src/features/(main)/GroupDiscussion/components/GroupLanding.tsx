import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { getDocumentErrorMessage } from "@/shared/api/documents";
import { createGroup, groupKeys, listGroups } from "../service/groups";
import { isValidEmail, parseMemberEmails } from "../util/discussion";
import { field, softButton, surface } from "../util/styles";
import { ErrorNotice } from "./ErrorNotice";

export function GroupLanding({
  initialDocumentId,
}: {
  initialDocumentId: string;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [error, setError] = useState("");

  const groups = useInfiniteQuery({
    queryKey: groupKeys.lists,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listGroups(pageParam),
    getNextPageParam: (page, pages) =>
      page.hasMore ? pages.length + 1 : undefined,
    retry: false,
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const create = useMutation({ mutationFn: createGroup });

  const rooms = [
    ...new Map(
      groups.data?.pages
        .flatMap((page) => page.items)
        .map((group) => [group.id, group]),
    ).values(),
  ];

  const open = (id: string) => {
    const params = new URLSearchParams({ groupId: id });
    if (initialDocumentId) params.set("documentId", initialDocumentId);
    router.push(`/canvas-discussion?${params}`);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    const emails = parseMemberEmails(String(values.get("emails") ?? ""));
    if (!name) return;
    if (emails.some((email) => !isValidEmail(email))) {
      setError("Periksa kembali alamat email anggota.");
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
      open(room.id);
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 text-white lg:grid-cols-2 lg:p-8">
      <section className={cn(surface, "p-6")}>
        <h1 className="text-lg font-semibold">Buat ruang diskusi</h1>
        <p className="mt-1 text-sm text-white/60">
          Ketua kelompok membuat grup, lalu menambahkan email anggota agar
          mereka bisa bergabung dan mengobrol.
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm">
            Nama grup
            <input required maxLength={120} name="name" className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Deskripsi <span className="text-white/40">(opsional)</span>
            <textarea name="description" maxLength={2000} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Email anggota <span className="text-white/40">(opsional)</span>
            <textarea
              name="emails"
              rows={2}
              placeholder="budi@example.com, siti@example.com"
              className={field}
            />
          </label>
          {error && <ErrorNotice message={error} />}
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-static-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            <Plus size={16} />
            {create.isPending ? "Membuat grup…" : "Buat grup"}
          </button>
        </form>
      </section>

      <section className={cn(surface, "flex flex-col p-6")}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Grup Anda</h2>
          <button
            type="button"
            className={softButton}
            disabled={groups.isFetching}
            onClick={() => void groups.refetch()}
          >
            <RefreshCw size={13} />
            Muat ulang
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-2">
          {groups.isPending && (
            <output className="text-sm text-white/60">Memuat grup…</output>
          )}
          {groups.error && (
            <ErrorNotice message={getDocumentErrorMessage(groups.error)} />
          )}
          {groups.isSuccess && rooms.length === 0 && (
            <p className="rounded-lg border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/55">
              Belum ada grup. Buat grup pertama Anda, atau minta ketua kelompok
              menambahkan email Anda.
            </p>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => open(room.id)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <span>
                <span className="font-medium">{room.name}</span>
                {room.description && (
                  <span className="mt-0.5 block text-xs text-white/50">
                    {room.description}
                  </span>
                )}
              </span>
              <span className="text-xs text-white/40">Buka</span>
            </button>
          ))}
          {groups.hasNextPage && (
            <button
              type="button"
              className={softButton}
              disabled={groups.isFetchingNextPage}
              onClick={() => void groups.fetchNextPage()}
            >
              Muat lebih banyak
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
