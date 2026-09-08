export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;

export const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  return `${String(minutes).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function formatSpeed(speed: number) {
  return speed.toFixed(2).replace(/(\.\d)0$/, "$1");
}
