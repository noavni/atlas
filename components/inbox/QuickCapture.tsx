"use client";

import { AnimatePresence, motion } from "framer-motion";
import { File as FileIcon, Globe, Image as ImageIcon, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { Button } from "@/components/primitives/Button";
import { IconButton } from "@/components/primitives/IconButton";
import { Kbd } from "@/components/primitives/Kbd";
import { SPRING } from "@/lib/motion";
import { useMe } from "@/lib/queries/me";
import { useCapture } from "@/lib/queries/inbox";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

/**
 * Global quick-capture overlay.
 *  * ⌘N (or Ctrl-N) toggles
 *  * Enter submits a text capture
 *  * Mic button toggles voice recording via MediaRecorder; audio is uploaded
 *    as an attachment (upload-url flow lands in Phase 3b when we surface it;
 *    for now we enqueue a placeholder captured_voice marker so the inbox
 *    shows the item and the transcription queue picks it up when STT is wired)
 *
 * Capture is accept-and-ack: the modal closes as soon as the API returns.
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

  // ⌘N binding
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
  }, [open]);

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
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            className={cn(
              "relative z-10 w-full max-w-[520px] overflow-hidden rounded-lg border border-border-subtle shadow-4",
            )}
            style={{
              background: "var(--material-thick)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
            }}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                Quick capture
              </div>
              <Kbd>Esc</Kbd>
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void onSubmit();
                }
              }}
              placeholder="Anything at all. It goes in the inbox."
              rows={4}
              className="w-full resize-none bg-transparent px-4 py-3 text-md text-fg-1 outline-none placeholder:text-fg-4"
            />

            <AnimatePresence initial={false}>
              {recording && (
                <motion.div
                  key="wave"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING.gentle}
                  className="relative flex items-center gap-0.5 overflow-hidden border-t border-border-subtle bg-surface-1/40 px-4 py-3"
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
                  <span className="absolute end-3 font-mono text-[11px] text-fg-3">
                    {fmtElapsed(elapsed)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1 border-t border-border-subtle px-3 py-2">
              <IconButton
                onClick={toggleRecord}
                title={recording ? "Stop recording" : "Record voice"}
                className={cn(recording && "text-[var(--persimmon-500)]")}
              >
                <Icon icon={Mic} size={18} />
              </IconButton>
              <IconButton title="Image (soon)" disabled>
                <Icon icon={ImageIcon} size={18} />
              </IconButton>
              <IconButton title="File (soon)" disabled>
                <Icon icon={FileIcon} size={18} />
              </IconButton>
              <IconButton title="URL (soon)" disabled>
                <Icon icon={Globe} size={18} />
              </IconButton>
              <div className="ms-auto" />
              <Button
                variant="primary"
                onClick={onSubmit}
                disabled={!text.trim() || capture.isPending}
                trailingIcon={<Kbd inverse>↵</Kbd>}
              >
                Save to inbox
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
