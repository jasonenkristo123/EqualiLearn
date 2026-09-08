import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { getDocument, getDocumentErrorMessage } from "@/shared/api/documents";
import { field } from "../util/styles";
import { ErrorNotice } from "./ErrorNotice";

export function ShareDocument({
  onPrepared,
}: {
  onPrepared: (id: string, title: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const load = useMutation({ mutationFn: getDocument });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const id = value.includes("?")
        ? new URL(value, window.location.origin).searchParams.get("documentId")
        : value.trim();
      if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
        throw new Error(
          "Tempel tautan Kanvas Pikir atau ID dokumen yang valid.",
        );
      }
      const response = await load.mutateAsync(id);
      onPrepared(
        response.data.id,
        response.data.title || response.data.file_name,
      );
      setValue("");
    } catch (cause) {
      setError(getDocumentErrorMessage(cause));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <h3 className="text-sm font-semibold">Bagikan mind map</h3>
      <p className="text-xs text-white/55">
        Tempel tautan dari Kanvas Pikir. Tautannya dimasukkan ke kolom pesan,
        siap Anda kirim ke grup.
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          placeholder="/ppt-canvas?documentId=…"
          className={field}
        />
        <button
          type="submit"
          disabled={load.isPending}
          className="shrink-0 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-static-white hover:bg-sky-500 disabled:opacity-50"
        >
          {load.isPending ? "…" : "Siapkan"}
        </button>
      </div>
      <Link
        href="/ppt-canvas"
        className="inline-block text-xs text-app-accent underline"
      >
        Buka Kanvas Pikir
      </Link>
      {error && <ErrorNotice message={error} />}
    </form>
  );
}
