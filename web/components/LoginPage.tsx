"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiBase, apiFetch } from "@/lib/api";
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
    ? "flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
    : "flex-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200";
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
      if (!res.ok) throw new Error(data.message || "Sign in failed");
      setAuthToken(data.token);
      onLoginSuccess();
    } catch (err: unknown) {
      setError(String(err instanceof Error ? err.message : err));
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
      if (!res.ok) throw new Error(data.message || "Could not create account");
      setAuthToken(data.token);
      onLoginSuccess();
    } catch (err: unknown) {
      setError(String(err instanceof Error ? err.message : err));
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
      if (!res.ok) throw new Error(data.message || "Request failed");
      setInfo(
        data.message ||
          "If this username is registered, check the server console for a reset link (valid 1 hour)."
      );
      if (data.debugResetToken && data.debugResetUrl) {
        setDebugReset({ token: data.debugResetToken, url: data.debugResetUrl });
      }
    } catch (err: unknown) {
      setError(String(err instanceof Error ? err.message : err));
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
      if (!res.ok) throw new Error(data.message || "Reset failed");
      setInfo(data.message || "Password updated.");
      setPassword("");
      setPassword2("");
      setResetToken("");
      setMode("signin");
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err: unknown) {
      setError(String(err instanceof Error ? err.message : err));
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
    "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-100 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-stretch px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none lg:grid-cols-[1fr_minmax(0,26rem)] xl:grid-cols-[1.15fr_minmax(0,28rem)]">
          <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-10 text-white lg:flex">
            <div>
              <div className="flex items-center gap-2 text-zinc-300">
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
              <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
                Secure operator accounts, role-ready structure, and password
                recovery backed by your database — built for daily retail
                counters.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-400">
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
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                S
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Shopkeeper
              </span>
            </div>
            {mode === "forgot" || mode === "reset" ? (
              <button
                type="button"
                className="mb-6 inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                onClick={() => go("signin")}
              >
                ← Back to sign in
              </button>
            ) : null}

            {mode === "signin" || mode === "signup" ? (
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  Account
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {mode === "signin"
                    ? "Sign in with your operator username."
                    : "Add a teammate or a new shop login."}
                </p>
              </div>
            ) : mode === "forgot" ? (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Reset password
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Enter your username. If it exists, a reset link is written to
                  the API server console (valid 1 hour). Enable{" "}
                  <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
                    PASSWORD_RESET_DEBUG=true
                  </code>{" "}
                  in dev to show the link in the browser.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  New password
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Choose a strong password (8+ chars, letters and numbers).
                </p>
              </div>
            )}

            {mode === "signin" || mode === "signup" ? (
              <div className="mb-6 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
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
                  className="mt-1 block break-all text-blue-700 underline dark:text-blue-300"
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => go("forgot")}
                >
                  Forgot password?
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  disabled={busy || !username.trim() || !password}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            ) : null}

            {mode === "signup" ? (
              <form className="space-y-4" onSubmit={onSignUp}>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  <span className="mt-1 block text-xs text-zinc-400">
                    3–32 chars: lowercase, numbers, underscore
                  </span>
                </label>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email <span className="font-normal text-zinc-400">(optional)</span>
                  <input
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@shop.com"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  disabled={busy || !username.trim()}
                >
                  {busy ? "Sending…" : "Request reset"}
                </button>
              </form>
            ) : null}

            {mode === "reset" ? (
              <form className="space-y-4" onSubmit={onReset}>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Reset token
                  <input
                    className={inputClass}
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    placeholder="Paste token from reset link"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  disabled={
                    busy || !resetToken.trim() || !password || !password2
                  }
                >
                  {busy ? "Saving…" : "Update password"}
                </button>
              </form>
            ) : null}

            <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Protected session · Tokens expire per server policy
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
