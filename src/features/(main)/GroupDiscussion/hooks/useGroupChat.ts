"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/shared/lib/token";
import { getChatProtocol } from "../service/chat-protocol";
import { type ChatMessage, currentUser, groupKeys } from "../service/groups";

export type ChatConnection =
  | "unconfigured"
  | "connecting"
  | "connected"
  | "disconnected"
  | "authentication-required";

let clientCounter = 0;

export function useGroupChat(groupId: string) {
  const client = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ChatConnection>("connecting");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  /** Messages sent from this tab that the server has not echoed back yet. */
  const [pending, setPending] = useState<ChatMessage[]>([]);

  const settlePending = useCallback(
    (match: (message: ChatMessage) => boolean) => {
      setPending((current) => current.filter((message) => !match(message)));
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` explicitly recreates the socket
  useEffect(() => {
    const protocol = getChatProtocol();
    if (!protocol) {
      setStatus("unconfigured");
      return;
    }
    const token = getToken();
    if (!token) {
      setStatus("authentication-required");
      return;
    }
    const base = process.env.NEXT_PUBLIC_BASE_API_URL;
    if (!base) {
      setError("Alamat layanan chat belum dikonfigurasi.");
      setStatus("disconnected");
      return;
    }

    let disposed = false;
    let socket: WebSocket;
    setStatus("connecting");
    setError("");
    try {
      socket = new WebSocket(protocol.url(base, token, groupId));
      socketRef.current = socket;
    } catch {
      setStatus("disconnected");
      setError("Koneksi chat tidak dapat dibuat.");
      return;
    }

    socket.onopen = () => {
      if (disposed) return;
      try {
        if (protocol.subscribe) {
          socket.send(JSON.stringify(protocol.subscribe(groupId)));
        }
        setStatus("connected");
        // Pull anything missed while the socket was down.
        void client.invalidateQueries({
          queryKey: groupKeys.messages(groupId),
        });
      } catch {
        socket.close();
      }
    };

    socket.onmessage = (event) => {
      if (disposed || typeof event.data !== "string") return;
      let decoded: ReturnType<typeof protocol.decode>;
      try {
        decoded = protocol.decode(event.data, groupId);
      } catch {
        return;
      }
      if (!decoded) return;

      if (decoded.type === "error") {
        setError(decoded.message);
        return;
      }

      const message = decoded.message;
      if (message.groupId && message.groupId !== groupId) return;

      if (decoded.type === "ack") {
        settlePending((local) => local.id === `local-${decoded.clientId}`);
      } else {
        // No client id to correlate: drop an optimistic copy by content.
        settlePending(
          (local) =>
            local.content === message.content &&
            (!message.senderId || local.senderId === message.senderId),
        );
      }
      void client.invalidateQueries({
        queryKey: groupKeys.messages(groupId),
      });
    };

    socket.onerror = () => {
      if (!disposed) setError("Koneksi chat gagal. Coba sambungkan kembali.");
    };
    socket.onclose = () => {
      if (!disposed) setStatus("disconnected");
    };

    return () => {
      disposed = true;
      socketRef.current = null;
      socket.close();
    };
  }, [groupId, attempt, client, settlePending]);

  // A pending message is confirmed once the same text lands in server history.
  const history = client.getQueryData<{
    pages: { items: ChatMessage[] }[];
  }>(groupKeys.messages(groupId));
  useEffect(() => {
    if (!history || pending.length === 0) return;
    const known = new Set(
      history.pages.flatMap((page) => page.items).map((m) => m.content),
    );
    setPending((current) => current.filter((m) => !known.has(m.content)));
  }, [history, pending.length]);

  const send = useCallback(
    (content: string) => {
      const protocol = getChatProtocol();
      const socket = socketRef.current;
      if (!protocol || !socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("Chat belum tersambung. Pesan belum dikirim.");
      }
      clientCounter += 1;
      const clientId = `${Date.now()}-${clientCounter}`;
      const me = currentUser();
      socket.send(JSON.stringify(protocol.encode(groupId, content, clientId)));
      setPending((current) => [
        ...current,
        {
          id: `local-${clientId}`,
          groupId,
          senderId: me.id,
          author: me.name || "Anda",
          content,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);
    },
    [groupId],
  );

  return {
    status,
    error,
    pending,
    send,
    clearError: () => setError(""),
    reconnect: () => setAttempt((value) => value + 1),
  };
}
