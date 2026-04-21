"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { Button } from "@/components/primitives/Button";
import { Kbd } from "@/components/primitives/Kbd";
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!workspaceId) return;
        // Ship the capture as a voice placeholder; attachment upload + STT
        // wiring comes online in Phase 3b/5. Until then the item is visible
        // and enqueued; transcript stays null.
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
    } catch (err) {
      console.warn("mic denied", err);
    }
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
              placeholder={recording ? "Recording…" : "What's on your mind?"}
              rows={4}
              className="w-full resize-none bg-transparent px-4 py-3 text-md text-fg-1 outline-none placeholder:text-fg-4"
            />
            <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2">
              <button
                type="button"
                onClick={toggleRecord}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-sm font-medium transition-colors",
                  recording
                    ? "bg-danger-bg text-danger-fg"
                    : "bg-transparent text-fg-2 hover:bg-surface-hover hover:text-fg-1",
                )}
              >
                <Icon icon={recording ? MicOff : Mic} size={14} />
                <span>{recording ? "Stop" : "Voice"}</span>
              </button>
              <div className="ms-auto flex items-center gap-2 text-xs text-fg-3">
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
                <span>to save</span>
              </div>
              <Button
                variant="primary"
                leadingIcon={<Icon icon={Send} size={13} />}
                onClick={onSubmit}
                disabled={!text.trim() || capture.isPending}
              >
                Capture
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
