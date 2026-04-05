"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  apiBase,
  apiFetch,
  errorMessageFromUnknown,
  messageFromApiJsonBody,
} from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

type LoginPageProps = {
  onLoginSuccess: () => void;
};

type AuthUser = { username: string };

type LoginResponse = {
  token: string;
  user: AuthUser;
};

type Mode = "signin" | "signup" | "forgot" | "reset";

function tabBtn(active: boolean) {
  return active
    ? "flex-1 rounded-md bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
    : "flex-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground";
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [debugReset, setDebugReset] = useState<{
    token: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("reset");
    if (t) {
      setResetToken(t);
      setMode("reset");
    }
  }, []);

  useEffect(() => {
    setError(null);
    setDebugReset(null);
  }, [mode]);

  const parseJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  };

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`${apiBase()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });
      const data = (await parseJson(res)) as LoginResponse & { message?: string };
      if (!res.ok) {
        throw new Error(
          messageFromApiJsonBody(data) || "Sign in failed"
        );
      }
      setAuthToken(data.token);
      onLoginSuccess();
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const onSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`${apiBase()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          email: email.trim() || undefined,
        }),
      });
      const data = (await parseJson(res)) as LoginResponse & { message?: string };
      if (!res.ok) {
        throw new Error(
          messageFromApiJsonBody(data) || "Could not create account"
        );
      }
      setAuthToken(data.token);
      onLoginSuccess();
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDebugReset(null);
    try {
      const res = await apiFetch(`${apiBase()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
        }),
      });
      const data = (await parseJson(res)) as {
        message?: string;
        debugResetToken?: string;
        debugResetUrl?: string;
      };
      if (!res.ok) {
        throw new Error(messageFromApiJsonBody(data) || "Request failed");
      }
      setInfo(
        (typeof data.message === "string" && data.message) ||
          "If this username is registered, check the server console for a reset link (valid 1 hour)."
      );
      if (data.debugResetToken && data.debugResetUrl) {
        setDebugReset({ token: data.debugResetToken, url: data.debugResetUrl });
      }
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`${apiBase()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken.trim(),
          newPassword: password,
        }),
      });
      const data = (await parseJson(res)) as { message?: string };
      if (!res.ok) {
        throw new Error(messageFromApiJsonBody(data) || "Reset failed");
      }
      setInfo(
        (typeof data.message === "string" && data.message) || "Password updated."
      );
      setPassword("");
      setPassword2("");
      setResetToken("");
      setMode("signin");
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const go = useCallback((m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setDebugReset(null);
  }, []);

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-muted/80 via-background to-muted/50">
      <div className="absolute right-4 top-4 z-10 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-stretch px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/5 lg:grid-cols-[1fr_minmax(0,26rem)] xl:grid-cols-[1.15fr_minmax(0,28rem)]">
          <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-10 text-white lg:flex">
            <div>
              <div className="flex items-center gap-2 text-white/75">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-white">
                  S
                </span>
                <span className="text-sm font-semibold tracking-wide">
                  Shopkeeper
                </span>
              </div>
              <h1 className="mt-10 text-3xl font-semibold leading-tight tracking-tight">
                Digital khata &amp; billing
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
                Secure operator accounts, role-ready structure, and password
                recovery backed by your database — built for daily retail
                counters.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-white/65">
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span>
                Bcrypt password storage (MongoDB)
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span>
                Reset tokens with expiry
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span>
                Optional team sign-up
              </li>
            </ul>
          </aside>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                S
              </span>
              <span className="text-sm font-semibold text-foreground">
                Shopkeeper
              </span>
            </div>
            {mode === "forgot" || mode === "reset" ? (
              <button
                type="button"
                className="mb-6 inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => go("signin")}
              >
                ← Back to sign in
              </button>
            ) : null}

            {mode === "signin" || mode === "signup" ? (
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Account
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Sign in with your operator username."
                    : "Add a teammate or a new shop login."}
                </p>
              </div>
            ) : mode === "forgot" ? (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Reset password
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your username. If it exists, a reset link is written to
                  the API server console (valid 1 hour). Enable{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    PASSWORD_RESET_DEBUG=true
                  </code>{" "}
                  in dev to show the link in the browser.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  New password
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a strong password (8+ chars, letters and numbers).
                </p>
              </div>
            )}

            {mode === "signin" || mode === "signup" ? (
              <div className="mb-6 flex rounded-xl bg-muted p-1">
                <button
                  type="button"
                  className={tabBtn(mode === "signin")}
                  onClick={() => go("signin")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={tabBtn(mode === "signup")}
                  onClick={() => go("signup")}
                >
                  Sign up
                </button>
              </div>
            ) : null}

            {error ? (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            {info ? (
              <div
                className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
                role="status"
              >
                {info}
              </div>
            ) : null}

            {debugReset ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-semibold">Dev only — reset link</p>
                <a
                  href={debugReset.url}
                  className="mt-1 block break-all text-primary underline"
                >
                  {debugReset.url}
                </a>
                <p className="mt-2 font-mono break-all opacity-90">
                  token: {debugReset.token}
                </p>
              </div>
            ) : null}

            {mode === "signin" ? (
              <form className="space-y-4" onSubmit={onSignIn}>
                <label className="block text-sm font-medium text-foreground">
                  Username
                  <input
                    className={inputClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    autoComplete="username"
                    required
                    placeholder="e.g. admin"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Password
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                  onClick={() => go("forgot")}
                >
                  Forgot password?
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                  disabled={busy || !username.trim() || !password}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            ) : null}

            {mode === "signup" ? (
              <form className="space-y-4" onSubmit={onSignUp}>
                <label className="block text-sm font-medium text-foreground">
                  Username
                  <input
                    className={inputClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[a-z0-9_]+"
                    title="Lowercase letters, numbers, underscore only"
                    placeholder="shop_owner_1"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    3–32 chars: lowercase, numbers, underscore
                  </span>
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Email <span className="font-normal text-muted-foreground">(optional)</span>
                  <input
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@shop.com"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Password
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="8+ characters, letters & numbers"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Confirm password
                  <input
                    type="password"
                    className={inputClass}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                  disabled={
                    busy ||
                    !username.trim() ||
                    !password ||
                    !password2
                  }
                >
                  {busy ? "Creating…" : "Create account"}
                </button>
              </form>
            ) : null}

            {mode === "forgot" ? (
              <form className="space-y-4" onSubmit={onForgot}>
                <label className="block text-sm font-medium text-foreground">
                  Username
                  <input
                    className={inputClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    autoComplete="username"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                  disabled={busy || !username.trim()}
                >
                  {busy ? "Sending…" : "Request reset"}
                </button>
              </form>
            ) : null}

            {mode === "reset" ? (
              <form className="space-y-4" onSubmit={onReset}>
                <label className="block text-sm font-medium text-foreground">
                  Reset token
                  <input
                    className={inputClass}
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    placeholder="Paste token from reset link"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  New password
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Confirm new password
                  <input
                    type="password"
                    className={inputClass}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                  disabled={
                    busy || !resetToken.trim() || !password || !password2
                  }
                >
                  {busy ? "Saving…" : "Update password"}
                </button>
              </form>
            ) : null}

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Protected session · Tokens expire per server policy
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
