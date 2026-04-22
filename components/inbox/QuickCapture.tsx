"use client";

import { AnimatePresence, motion } from "framer-motion";
import { File as FileIcon, Globe, Image as ImageIcon, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { Kbd } from "@/components/primitives/Kbd";
import { SPRING } from "@/lib/motion";
import { useMe } from "@/lib/queries/me";
import { useCapture } from "@/lib/queries/inbox";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

/**
 * Global quick-capture overlay. Visually matches the inline Brain-dump
 * capture bar — same structure, just floated over the page when ⌘N
 * triggers it from somewhere else.
 */
export function QuickCapture() {
  const open = useUI((s) => s.quickCaptureOpen);
  const setOpen = useUI((s) => s.setQuickCaptureOpen);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const capture = useCapture();

  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setText("");
    else setTimeout(() => taRef.current?.focus(), 40);
  }, [open]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text, open]);

  async function onSubmit() {
    if (!workspaceId || !text.trim()) return;
    await capture.mutateAsync({ workspaceId, kind: "text", raw_text: text.trim() });
    setOpen(false);
  }

  async function toggleRecord() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecording(false);
        setElapsed(0);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!workspaceId) return;
        const sizeKb = Math.round(blob.size / 1024);
        await capture.mutateAsync({
          workspaceId,
          kind: "voice",
          source: "web",
          raw_text: `Voice memo (${sizeKb} KB)`,
          attachments: [{ pending: true, mime_type: "audio/webm", size_kb: sizeKb }],
        });
        setOpen(false);
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err) {
      console.warn("mic denied", err);
    }
  }

  function fmtElapsed(s: number): string {
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-0 bg-black/40"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          />
          <motion.div
            className={cn(
              "atlas-quick-capture",
              "relative z-10 flex w-full max-w-[600px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-surface-raised",
              "shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06),0_28px_64px_-16px_rgba(0,0,0,0.4)]",
              "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06),0_28px_64px_-16px_rgba(0,0,0,0.6)]",
            )}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Eyebrow row — 24px side padding + 20px top, 8px bottom (space-5 / space-3) */}
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <span className="text-[11.5px] font-medium lowercase tracking-[0.02em] text-fg-3">
                quick capture
              </span>
              <Kbd>⌘N</Kbd>
            </div>
            {/* Input — generous vertical padding, big readable serif */}
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void onSubmit();
                }
                if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  if (!text.includes("\n")) {
                    e.preventDefault();
                    void onSubmit();
                  }
                }
              }}
              placeholder="Anything at all. It goes in the inbox."
              rows={2}
              dir="auto"
              className="w-full resize-none bg-transparent px-6 pb-5 pt-2 font-serif text-[17px] leading-[1.5] text-fg-1 outline-none placeholder:text-fg-4"
              style={{ minHeight: 72 }}
            />

            <AnimatePresence initial={false}>
              {recording && (
                <motion.div
                  key="wave"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING.gentle}
                  className="relative flex items-center gap-0.5 overflow-hidden bg-surface-1/40 px-6 py-3"
                >
                  {Array.from({ length: 48 }).map((_, i) => (
                    <span
                      key={i}
                      className="qc-wave-bar inline-block w-[3px] rounded-full bg-[var(--persimmon-500)]"
                      style={
                        {
                          ["--qc-bar-delay" as const]: `${i * 60}ms`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                  <span className="absolute end-6 font-mono text-[11px] text-fg-3">
                    {fmtElapsed(elapsed)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action row — 20px side padding, 14px vertical (space-5 / ~space-4.5) */}
            <div className="flex items-center gap-1.5 border-t border-border-subtle/70 px-5 py-3.5">
              <IconButton
                size="sm"
                onClick={toggleRecord}
                title={recording ? "Stop recording" : "Record voice"}
                className={cn(recording && "text-[var(--persimmon-500)]")}
              >
                <Icon icon={Mic} size={15} />
              </IconButton>
              <IconButton size="sm" title="Image (soon)" disabled>
                <Icon icon={ImageIcon} size={15} />
              </IconButton>
              <IconButton size="sm" title="File (soon)" disabled>
                <Icon icon={FileIcon} size={15} />
              </IconButton>
              <IconButton size="sm" title="Link (soon)" disabled>
                <Icon icon={Globe} size={15} />
              </IconButton>
              <div className="ms-auto" />
              <button
                type="button"
                onClick={onSubmit}
                disabled={!text.trim() || capture.isPending}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium shadow-1 transition-opacity",
                  text.trim()
                    ? "bg-accent text-fg-on-accent hover:opacity-90"
                    : "cursor-not-allowed bg-surface-2 text-fg-4",
                )}
              >
                Save to inbox
                {text.trim() && <Kbd className="bg-white/20 text-fg-on-accent">↵</Kbd>}
              </button>
            </div>

            {/* Drag handle — macOS sheet detail */}
            <div className="flex justify-center pb-2 pt-1.5">
              <div className="h-[3px] w-8 rounded-full bg-fg-4/25" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
