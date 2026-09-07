"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechToTextUrl,
  parseSpeechSocketMessage,
} from "../service/speech-to-text";
import type {
  SpeechToTextStatus,
  SpeechTranscriptPayload,
  SpeechTranscriptSegment,
} from "../type/speech-to-text.type";

const WORKLET_URL = "/worklets/pcm16-capture-processor.js";
const READY_TIMEOUT_MS = 10_000;

interface WorkletMessage {
  type: "audio" | "flushed";
  buffer?: ArrayBuffer;
}

export function useSpeechToText(language = "id-ID") {
  const [status, setStatus] = useState<SpeechToTextStatus>("idle");
  const [transcripts, setTranscripts] = useState<SpeechTranscriptSegment[]>([]);
  const [interim, setInterim] = useState<SpeechTranscriptPayload | null>(null);
  const [finalText, setFinalText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusRef = useRef<SpeechToTextStatus>("idle");
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const runIdRef = useRef(0);
  const segmentIdRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const mountedRef = useRef(true);

  const updateStatus = useCallback((nextStatus: SpeechToTextStatus) => {
    statusRef.current = nextStatus;
    if (mountedRef.current) setStatus(nextStatus);
  }, []);

  const releaseAudio = useCallback(async () => {
    const worklet = workletRef.current;
    const source = sourceRef.current;
    const silentGain = silentGainRef.current;
    const audioContext = audioContextRef.current;
    const stream = streamRef.current;

    workletRef.current = null;
    sourceRef.current = null;
    silentGainRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    worklet?.disconnect();
    source?.disconnect();
    silentGain?.disconnect();
    worklet?.port.close();
    stream?.getTracks().forEach((track) => {
      track.stop();
    });

    if (audioContext && audioContext.state !== "closed") {
      await audioContext.close().catch(() => undefined);
    }
  }, []);

  const connectAudio = useCallback(
    async (stream: MediaStream, targetSampleRate: number, runId: number) => {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule(WORKLET_URL);

      if (runId !== runIdRef.current || stopRequestedRef.current) return;

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(
        audioContext,
        "pcm16-capture-processor",
        { processorOptions: { targetSampleRate } },
      );
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      sourceRef.current = source;
      workletRef.current = worklet;
      silentGainRef.current = silentGain;

      worklet.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
        if (event.data.type !== "audio" || !event.data.buffer) return;
        const socket = socketRef.current;
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(event.data.buffer);
        }
      };

      source.connect(worklet);
      worklet.connect(silentGain);
      silentGain.connect(audioContext.destination);
      await audioContext.resume();
    },
    [],
  );

  const start = useCallback(async () => {
    if (
      statusRef.current === "requesting-permission" ||
      statusRef.current === "connecting" ||
      statusRef.current === "recording" ||
      statusRef.current === "stopping"
    ) {
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    stopRequestedRef.current = false;
    segmentIdRef.current = 0;
    setTranscripts([]);
    setInterim(null);
    setFinalText("");
    setSessionId(null);
    setErrorMessage(null);
    updateStatus("requesting-permission");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser ini tidak mendukung akses mikrofon.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (runId !== runIdRef.current || stopRequestedRef.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }

      streamRef.current = stream;
      updateStatus("connecting");

      const socket = new WebSocket(getSpeechToTextUrl(language));
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      const readyTimer = window.setTimeout(() => {
        if (runId !== runIdRef.current || statusRef.current !== "connecting") {
          return;
        }
        setErrorMessage("Server transkripsi tidak merespons.");
        updateStatus("error");
        closeSocket(socket);
        void releaseAudio();
      }, READY_TIMEOUT_MS);

      socket.onmessage = (event) => {
        if (runId !== runIdRef.current || typeof event.data !== "string") {
          return;
        }

        const message = parseSpeechSocketMessage(event.data);
        if (!message) return;

        switch (message.type) {
          case "ready": {
            window.clearTimeout(readyTimer);
            setSessionId(message.payload.session_id);
            void connectAudio(stream, message.payload.sample_rate, runId).then(
              () => {
                if (runId === runIdRef.current && !stopRequestedRef.current) {
                  updateStatus("recording");
                }
              },
              (error: unknown) => {
                setErrorMessage(getErrorMessage(error));
                updateStatus("error");
                closeSocket(socket);
                void releaseAudio();
              },
            );
            break;
          }
          case "transcript": {
            const transcript = message.payload;
            if (transcript.is_final) {
              segmentIdRef.current += 1;
              setTranscripts((current) => [
                ...current,
                {
                  ...transcript,
                  id: `${transcript.session_id}-${segmentIdRef.current}`,
                },
              ]);
              setFinalText((current) =>
                [current.trim(), transcript.text.trim()]
                  .filter(Boolean)
                  .join(" "),
              );
              setInterim(null);
            } else {
              setInterim(transcript);
            }
            break;
          }
          case "finished":
            stopRequestedRef.current = true;
            setFinalText(message.payload.text);
            setInterim(null);
            updateStatus("stopped");
            void releaseAudio();
            closeSocket(socket, 1000, "Transcription finished");
            break;
          case "error":
            setErrorMessage(message.payload.message);
            updateStatus("error");
            void releaseAudio();
            closeSocket(socket);
            break;
        }
      };

      socket.onerror = () => {
        window.clearTimeout(readyTimer);
        if (stopRequestedRef.current || !mountedRef.current) return;
        setErrorMessage("Koneksi WebSocket gagal.");
        updateStatus("error");
      };

      socket.onclose = () => {
        window.clearTimeout(readyTimer);
        if (socketRef.current === socket) socketRef.current = null;
        void releaseAudio();

        if (!mountedRef.current) return;
        if (stopRequestedRef.current) {
          updateStatus("stopped");
        } else if (statusRef.current !== "error") {
          setErrorMessage("Koneksi transkripsi terputus.");
          updateStatus("error");
        }
      };
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      updateStatus("error");
      await releaseAudio();
    }
  }, [connectAudio, language, releaseAudio, updateStatus]);

  const stop = useCallback(async () => {
    if (
      statusRef.current === "idle" ||
      statusRef.current === "stopped" ||
      statusRef.current === "stopping"
    ) {
      return;
    }

    stopRequestedRef.current = true;
    updateStatus("stopping");

    const worklet = workletRef.current;
    if (worklet) {
      await flushWorklet(worklet);
    }

    await releaseAudio();

    const socket = socketRef.current;
    socketRef.current = null;
    if (
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      closeSocket(socket, 1000, "Recording stopped");
    }

    updateStatus("stopped");
  }, [releaseAudio, updateStatus]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRequestedRef.current = true;
      runIdRef.current += 1;
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) closeSocket(socket, 1000, "Component unmounted");
      void releaseAudio();
    };
  }, [releaseAudio]);

  return {
    status,
    transcripts,
    interim,
    finalText,
    sessionId,
    errorMessage,
    start,
    stop,
  };
}

function flushWorklet(worklet: AudioWorkletNode) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 250);
    const handleMessage = (event: MessageEvent<WorkletMessage>) => {
      if (event.data.type !== "flushed") return;
      window.clearTimeout(timeout);
      worklet.port.removeEventListener("message", handleMessage);
      resolve();
    };

    worklet.port.addEventListener("message", handleMessage);
    worklet.port.postMessage({ type: "flush" });
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Izin mikrofon ditolak. Aktifkan izin mikrofon lalu coba lagi.";
  }
  return error instanceof Error ? error.message : "Gagal memulai perekaman.";
}

function closeSocket(socket: WebSocket, code?: number, reason?: string) {
  try {
    if (socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    } else if (socket.readyState === WebSocket.OPEN) {
      socket.close(code, reason);
    }
  } catch {}
}
