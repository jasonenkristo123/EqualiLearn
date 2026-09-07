/**
 * Edge-safe auth cookie helpers — no `document`, no `js-cookie`.
 * Safe to import from middleware and from client code alike.
 */

export const TOKEN_COOKIE = "eql_access_token";
export const TOKEN_MAX_AGE_DAYS = 7;

/** Pull an auth token out of an unknown API payload shape. */
export function extractToken(payload: unknown): string | undefined {
  const visit = (value: unknown, depth: number): string | undefined => {
    if (typeof value === "string") return value.length > 0 ? value : undefined;
    if (!value || typeof value !== "object" || depth > 3) return undefined;

    const record = value as Record<string, unknown>;
    for (const key of ["token", "access_token", "accessToken"]) {
      const found = record[key];
      if (typeof found === "string" && found.length > 0) return found;
    }
    return visit(record.data, depth + 1);
  };

  return visit(payload, 0);
}
