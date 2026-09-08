import {
  LoaderCircle,
  Mic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import type { SpeechVoice } from "../type/ppt-audio.type";
import { formatSpeed, formatTime, MONO } from "../util/format";
import { IconButton } from "./IconButton";

export function PlaybackBar({
  audioRef,
  audioUrl,
  position,
  duration,
  speed,
  isPlaying,
  synthesizing,
  hasNarration,
  voices,
  voicesLoading,
  activeVoiceId,
  pendingPlayRef,
  onSeek,
  onTogglePlay,
  onCycleSpeed,
  onVoiceChange,
  onDuration,
  onPosition,
  onPlayingChange,
  onAudioError,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  audioUrl: string | null;
  position: number;
  duration: number;
  speed: number;
  isPlaying: boolean;
  synthesizing: boolean;
  hasNarration: boolean;
  voices: SpeechVoice[];
  voicesLoading: boolean;
  activeVoiceId: string;
  pendingPlayRef: RefObject<boolean>;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onCycleSpeed: () => void;
  onVoiceChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onDuration: (duration: number) => void;
  onPosition: (seconds: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onAudioError: () => void;
}) {
  const progressPct = duration ? (position / duration) * 100 : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value)) onDuration(value);
        }}
        onTimeUpdate={(event) => onPosition(event.currentTarget.currentTime)}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        onEnded={() => onPlayingChange(false)}
        onError={onAudioError}
        onCanPlay={(event) => {
          if (!pendingPlayRef.current) return;
          pendingPlayRef.current = false;
          void event.currentTarget.play().catch(() => {
            toast.error("Browser tidak dapat memutar audio ini.");
          });
        }}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center gap-1">
        <IconButton label="Ke awal" onClick={() => onSeek(0)}>
          <SkipBack className="size-4" />
        </IconButton>
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!hasNarration || synthesizing}
          aria-label={isPlaying ? "Jeda" : "Putar"}
          className="grid size-11 place-items-center rounded-full bg-white text-app-background transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-40 disabled:hover:scale-100"
        >
          {synthesizing ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 translate-x-px" />
          )}
        </button>
        <IconButton
          label="Ke akhir"
          onClick={() => {
            onSeek(duration);
            audioRef.current?.pause();
          }}
        >
          <SkipForward className="size-4" />
        </IconButton>
      </div>

      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <span className={cn(MONO, "text-xs tabular-nums text-white/50")}>
          {formatTime(position)}
        </span>
        <div className="relative flex-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-sky-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={position}
            onChange={(event) => onSeek(Number(event.target.value))}
            disabled={!audioUrl}
            aria-label="Posisi pemutaran"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <span className={cn(MONO, "text-xs tabular-nums text-white/50")}>
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCycleSpeed}
          aria-label={`Kecepatan pemutaran ${formatSpeed(speed)}x`}
          className="rounded-md border border-white/15 bg-white/[0.03] px-2.5 py-1 font-inter-500 text-xs tabular-nums text-white/70 transition-colors hover:text-white"
        >
          {formatSpeed(speed)}x
        </button>
        <label className="inline-flex items-center gap-1.5 rounded-md border border-cyan/30 bg-cyan/10 px-2.5 py-1 font-inter-500 text-xs text-app-teal">
          <Mic className="size-3" />
          <span className="sr-only">Pilih suara AI Narrator</span>
          <select
            value={activeVoiceId}
            onChange={onVoiceChange}
            disabled={voicesLoading || synthesizing}
            className="max-w-44 bg-transparent text-app-teal outline-none disabled:opacity-50"
          >
            {voices.length === 0 && (
              <option value="aura-asteria-en">AI Narrator</option>
            )}
            {voices.map((voice) => (
              <option
                key={voice.id}
                value={voice.id}
                className="bg-app-background"
              >
                {voice.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
