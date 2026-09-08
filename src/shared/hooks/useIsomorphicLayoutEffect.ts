import { useEffect, useLayoutEffect } from "react";

/** `useLayoutEffect` on the client, `useEffect` during SSR (avoids the warning). */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
