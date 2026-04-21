"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/inbox` : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-app px-5">
      <div className="w-full max-w-[360px] rounded-lg border border-border-subtle bg-surface-raised p-7 shadow-3">
        <div className="mb-1 font-display text-2xl font-semibold tracking-[-0.018em] text-fg-1">
          Atlas
        </div>
        <p className="mb-5 text-sm text-fg-3">A private workspace.</p>
        {sent ? (
          <p className="text-base text-fg-2">Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-fg-2">Email</span>
              <Input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error && <div className="text-sm text-danger-fg">{error}</div>}
            <Button type="submit" variant="primary" fullWidth disabled={submitting}>
              {submitting ? "Sending…" : "Send sign-in link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
