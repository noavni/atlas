"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Magic-link integration lands with Phase 1.
    setSent(true);
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
            <Button type="submit" variant="primary" fullWidth>
              Send sign-in link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
