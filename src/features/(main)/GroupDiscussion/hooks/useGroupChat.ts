"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/shared/lib/token";
import { getChatProtocol } from "../service/chat-protocol";
import { groupKeys } from "../service/groups";

export type ChatConnection =
  | "unconfigured"
  | "connecting"
  | "connected"
  | "disconnected"
  | "authentication-required";

export function useGroupChat(groupId: string) {
  const client = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ChatConnection>("unconfigured");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry counter explicitly recreates the connection
  useEffect(() => {
    const protocol = getChatProtocol();
    if (!protocol) return;
    const token = getToken();
    if (!token) {
      setStatus("authentication-required");
      return;
    }
    const base = process.env.NEXT_PUBLIC_BASE_API_URL;
    if (!base) {
      setError("Alamat layanan chat belum tersedia.");
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
        if (protocol.subscribe)
          socket.send(JSON.stringify(protocol.subscribe(groupId)));
        setStatus("connected");
        // Catch messages missed during disconnection using durable history.
        void client.invalidateQueries({
          queryKey: groupKeys.messages(groupId),
        });
      } catch {
        socket.close();
      }
    };
    socket.onmessage = (event) => {
      if (disposed || typeof event.data !== "string") return;
      try {
        const message = protocol.decode(event.data);
        if (message?.type === "error") setError(message.message);
        if (
          message?.type === "message" &&
          message.message.groupId === groupId
        ) {
          void client.invalidateQueries({
            queryKey: groupKeys.messages(groupId),
          });
        }
      } catch {
        setError("Pesan dari layanan chat tidak dapat dibaca.");
      }
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
  }, [groupId, attempt, client]);

  const send = useCallback(
    (content: string) => {
      const protocol = getChatProtocol();
      const socket = socketRef.current;
      if (!protocol || !socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("Chat belum tersambung. Pesan belum dikirim.");
      }
      socket.send(JSON.stringify(protocol.encode(groupId, content)));
      // Socket.send is not an acknowledgement; only history renders sent messages.
    },
    [groupId],
  );

  return {
    status,
    error,
    send,
    reconnect: () => setAttempt((value) => value + 1),
  };
}
