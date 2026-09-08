import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { getDocumentErrorMessage } from "@/shared/api/documents";
import {
  addMember,
  type ChatGroup,
  groupKeys,
  removeMember,
} from "../service/groups";
import { field } from "../util/styles";
import { ErrorNotice } from "./ErrorNotice";

export function InvitePanel({
  group,
  onClose,
}: {
  group: ChatGroup;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  const invite = useMutation({
    mutationFn: (email: string) => addMember(group.id, email),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeMember(group.id, userId),
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    setError("");
    setNotice("");
    try {
      await invite.mutateAsync(email);
      await client.invalidateQueries({ queryKey: groupKeys.detail(group.id) });
      void client.invalidateQueries({ queryKey: groupKeys.lists });
      form.reset();
      setNotice(`Undangan untuk ${email} ditambahkan.`);
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  const confirmRemove = async () => {
    setError("");
    try {
      await remove.mutateAsync(removing);
      setRemoving("");
      await client.invalidateQueries({ queryKey: groupKeys.detail(group.id) });
      void client.invalidateQueries({ queryKey: groupKeys.lists });
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <div className="space-y-3 border-b border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Anggota grup</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="rounded p-1 text-white/50 hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>

      <ul className="space-y-1.5">
        {group.members.length === 0 && (
          <li className="text-xs text-white/50">
            Respons grup belum memuat daftar anggota.
          </li>
        )}
        {group.members.map((member, index) => (
          <li
            key={member.userId || member.email || index}
            className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs"
          >
            <span>
              {member.name || member.email || "Anggota"}
              <span className="ml-2 text-white/40">{member.role}</span>
            </span>
            <button
              type="button"
              className="text-white/45 hover:text-app-danger disabled:opacity-30"
              disabled={!member.userId || remove.isPending}
              onClick={() => setRemoving(member.userId)}
              aria-label="Keluarkan anggota"
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>

      {removing && (
        <div className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs">
          <span>Keluarkan anggota ini?</span>
          <button
            type="button"
            className="ml-auto text-app-danger underline disabled:opacity-40"
            disabled={remove.isPending}
            onClick={() => void confirmRemove()}
          >
            Ya
          </button>
          <button
            type="button"
            className="text-white/60 underline"
            onClick={() => setRemoving("")}
          >
            Batal
          </button>
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email anggota baru"
          className={field}
        />
        <button
          type="submit"
          disabled={invite.isPending}
          className="shrink-0 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-static-white hover:bg-sky-500 disabled:opacity-50"
        >
          {invite.isPending ? "…" : "Tambah"}
        </button>
      </form>
      {notice && <p className="text-xs text-app-success">{notice}</p>}
      {error && <ErrorNotice message={error} />}
    </div>
  );
}
