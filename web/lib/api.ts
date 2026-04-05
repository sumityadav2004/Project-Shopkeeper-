import { clearAuthToken, getAuthToken } from "@/lib/auth";

/** Normalized text for UI when catching `unknown`. */
export function errorMessageFromUnknown(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return "Something went wrong.";
}

/** Shapes returned by Express routes (auth uses `message`, CRUD routes often use `error`). */
type ApiErrorJson = {
  message?: unknown;
  error?: unknown;
};

function pickApiErrorText(parsed: ApiErrorJson): string | null {
  const m = typeof parsed.message === "string" ? parsed.message.trim() : "";
  if (m) return m;
  const e = typeof parsed.error === "string" ? parsed.error.trim() : "";
  if (e) return e;
  return null;
}

/** After `parseJson` on a failed auth/API response body. */
export function messageFromApiJsonBody(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  return pickApiErrorText(data as ApiErrorJson);
}

function toNetworkError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  const looksLikeNetwork =
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
  if (looksLikeNetwork) {
    return new Error(
      "API server tak connect nahi ho paya. Shopkeeper folder se `npm run dev` chalao (web + server dono). Sirf `web` folder se dev chalane par API band rehti hai."
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

async function fetchWithNetworkHandling(
  input: string,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e) {
    throw toNetworkError(e);
  }
}

/**
 * Base URL for API calls. In the browser, empty string = same origin so Next.js
 * can rewrite `/api/*` to the Express server (works with http://192.168.x.x:3000 too).
 */
export function apiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (typeof window !== "undefined") return "";
  return "http://127.0.0.1:4000";
}

/** Use for non-JSON flows (e.g. login) so network failures get a clear message. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetchWithNetworkHandling(input, init);
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetchWithNetworkHandling(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuthToken();
    throw new Error("Session expired. Please login again.");
  }
  if (!res.ok) {
    const text = await res.text();
    const jsonMessage = (() => {
      const t = text.trim();
      if (!t.startsWith("{") && !t.startsWith("[")) return null;
      try {
        const parsed = JSON.parse(text) as ApiErrorJson;
        return pickApiErrorText(parsed);
      } catch {
        return null;
      }
    })();
    if (jsonMessage) {
      if (/ENOENT.*[\\/]\.next[\\/]/i.test(jsonMessage)) {
        throw new Error(
          "Next.js build cache corrupt ya incomplete. Band karein saare dev servers, phir web folder me: npm run clean && npm run dev (ya Shopkeeper root se npm run dev)."
        );
      }
      throw new Error(jsonMessage);
    }
    const looksLikeHtml = /<!DOCTYPE|<html[\s>]/i.test(text);
    if (looksLikeHtml || text.length > 800) {
      throw new Error(
        `Server error (${res.status}). Next.js build cache: web folder me "npm run clean" phir dev dubara chalao. Shopkeeper root se "npm run dev" se API + web dono ek saath.`
      );
    }
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}
