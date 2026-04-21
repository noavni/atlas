"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";
import { read as xlsxRead, utils as xlsxUtils } from "xlsx";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { SPRING } from "@/lib/motion";
import { useBulkCreateLeads, type BulkLeadInput } from "@/lib/queries/leads";
import { useMe } from "@/lib/queries/me";
import { useLeadsUI } from "@/lib/store/leads";
import type { LeadStage } from "@/lib/types";

type Row = Record<string, unknown>;

const TARGETS = [
  "name",
  "role",
  "company",
  "email",
  "phone",
  "location",
  "source",
  "stage",
  "value_cents",
  "tags",
  "linkedin_url",
  "next_step",
  "first_note",
  "skip",
] as const;
type Target = (typeof TARGETS)[number];

const HEADER_HINTS: Record<Target, string[]> = {
  name: ["name", "full name", "lead", "contact", "business", "שם"],
  role: ["role", "title", "position", "תפקיד"],
  company: ["company", "org", "business", "handle", "חברה"],
  email: ["email", "e-mail", "mail", "אימייל"],
  phone: ["phone", "mobile", "tel", "טלפון"],
  location: ["location", "city", "address", "מיקום", "עיר"],
  source: ["source", "channel", "where", "מקור"],
  stage: ["stage", "status", "pipeline", "שלב"],
  value_cents: ["value", "amount", "deal", "$"],
  tags: ["tags", "labels", "תגיות"],
  linkedin_url: ["linkedin", "url", "social", "instagram"],
  next_step: ["next", "follow", "action"],
  first_note: ["note", "notes", "comment", "הערה"],
  skip: [],
};

function autoMap(headers: string[]): Record<string, Target> {
  const out: Record<string, Target> = {};
  const used = new Set<Target>();
  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    let hit: Target = "skip";
    for (const t of TARGETS) {
      if (used.has(t) || t === "skip") continue;
      if (HEADER_HINTS[t].some((n) => lower.includes(n))) {
        hit = t;
        break;
      }
    }
    if (hit !== "skip") used.add(hit);
    out[h] = hit;
  }
  return out;
}

function parseStage(v: unknown): LeadStage {
  const s = String(v ?? "")
    .toLowerCase()
    .trim();
  if (["new", "contacted", "qualified", "proposal", "won", "lost"].includes(s))
    return s as LeadStage;
  return "new";
}

function parseMoney(v: unknown): number {
  const s = String(v ?? "").replace(/[^0-9.\-]/g, "");
  const f = parseFloat(s);
  if (!isFinite(f)) return 0;
  // Heuristic: looks like whole dollars → convert to cents
  return Math.round(f * 100);
}

function parseTags(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ImportLeadsModal() {
  const open = useLeadsUI((s) => s.importOpen);
  const setOpen = useLeadsUI((s) => s.setImportOpen);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const bulk = useBulkCreateLeads();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, Target>>({});
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setHeaders([]);
      setRows([]);
      setMapping({});
      setFileName("");
      setError(null);
      setProgress(null);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    const isExcel = /\.(xlsx|xls|ods)$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const wb = xlsxRead(reader.result as ArrayBuffer, { type: "array" });
          const first = wb.SheetNames[0];
          if (!first) throw new Error("Workbook has no sheets.");
          const sheet = wb.Sheets[first]!;
          const json = xlsxUtils.sheet_to_json<Row>(sheet, { defval: null });
          if (!json.length) throw new Error("Sheet is empty.");
          const hs = Object.keys(json[0] as Row);
          setHeaders(hs);
          setRows(json);
          setMapping(autoMap(hs));
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      };
      reader.onerror = () => setError("Could not read file.");
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse<Row>(file, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (res) => {
          if (res.errors.length) {
            const first = res.errors[0];
            setError(first ? `${first.type}: ${first.message}` : "CSV parse error.");
            return;
          }
          const hs = res.meta.fields ?? [];
          setHeaders(hs);
          setRows(res.data);
          setMapping(autoMap(hs));
        },
        error: (err) => setError(err.message),
      });
    }
  }

  function parsePasted(text: string) {
    setError(null);
    setFileName("pasted.csv");
    const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: "greedy" });
    if (res.errors.length) {
      const first = res.errors[0];
      setError(first ? first.message : "Could not parse.");
      return;
    }
    const hs = res.meta.fields ?? [];
    setHeaders(hs);
    setRows(res.data);
    setMapping(autoMap(hs));
  }

  const prepared: BulkLeadInput[] = useMemo(() => {
    if (!rows.length) return [];
    const invMap: Partial<Record<Target, string>> = {};
    for (const [src, tgt] of Object.entries(mapping)) {
      if (tgt !== "skip") invMap[tgt] = src;
    }
    const out: BulkLeadInput[] = [];
    for (const r of rows) {
      const name = invMap.name ? String(r[invMap.name] ?? "").trim() : "";
      if (!name) continue;
      out.push({
        name,
        role: invMap.role ? String(r[invMap.role] ?? "").trim() || undefined : undefined,
        company: invMap.company ? String(r[invMap.company] ?? "").trim() || undefined : undefined,
        email: invMap.email ? String(r[invMap.email] ?? "").trim() || undefined : undefined,
        phone: invMap.phone ? String(r[invMap.phone] ?? "").trim() || undefined : undefined,
        location: invMap.location ? String(r[invMap.location] ?? "").trim() || undefined : undefined,
        source: invMap.source ? String(r[invMap.source] ?? "").trim() || undefined : "Import",
        stage: invMap.stage ? parseStage(r[invMap.stage]) : "new",
        value_cents: invMap.value_cents ? parseMoney(r[invMap.value_cents]) : 0,
        tags: invMap.tags ? parseTags(r[invMap.tags]) : [],
        linkedin_url: invMap.linkedin_url
          ? String(r[invMap.linkedin_url] ?? "").trim() || undefined
          : undefined,
        next_step: invMap.next_step
          ? String(r[invMap.next_step] ?? "").trim() || undefined
          : undefined,
        first_note: invMap.first_note
          ? String(r[invMap.first_note] ?? "").trim() || undefined
          : undefined,
      });
    }
    return out;
  }, [rows, mapping]);

  async function runImport() {
    if (!workspaceId || !prepared.length) return;
    setProgress({ done: 0, total: prepared.length });
    try {
      await bulk.mutateAsync({ workspaceId, leads: prepared });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto px-4 py-[4vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            role="dialog"
            aria-labelledby="import-leads-title"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={SPRING.panel}
            className="relative z-10 flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-app shadow-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-none items-center gap-2.5 border-b border-border-subtle px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-fg-on-accent">
                <Icon icon={FileSpreadsheet} size={14} />
              </span>
              <h2
                id="import-leads-title"
                className="font-display text-[20px] font-semibold tracking-[-0.015em] text-fg-1"
              >
                Import leads
              </h2>
              {fileName && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-3">
                  {fileName}
                </span>
              )}
              <IconButton
                className="ms-auto"
                size="sm"
                title="Close"
                onClick={() => setOpen(false)}
              >
                <Icon icon={X} size={14} />
              </IconButton>
            </div>

            <div className="atlas-board-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {!headers.length && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-1 text-center transition-colors hover:bg-surface-2"
                  >
                    <Icon icon={Upload} size={22} className="text-fg-3" />
                    <div className="text-[13.5px] font-medium text-fg-1">
                      Drop a file or click to pick one
                    </div>
                    <div className="text-[11.5px] text-fg-3">
                      CSV, XLSX, XLS, ODS · up to ~10MB
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.ods,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                      Or paste CSV
                    </div>
                    <textarea
                      placeholder={`name,company,phone,email,stage\nMaya Greenberg,Ferngrove Studio,+972 50 555 1234,maya@ferngrove.co,new`}
                      className="min-h-[110px] w-full resize-y rounded-md border border-border-subtle bg-surface-1 px-2.5 py-2 font-mono text-[11.5px] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent"
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (!v) return;
                        // Parse only on first newline to avoid re-parsing on each keystroke
                      }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) parsePasted(v);
                      }}
                    />
                  </div>
                </>
              )}

              {headers.length > 0 && (
                <>
                  <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                      Map columns — {rows.length} rows detected
                    </div>
                    <div className="flex flex-col gap-2">
                      {headers.map((h) => (
                        <div key={h} className="flex items-center gap-3">
                          <span className="w-[40%] truncate rounded-md bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-fg-2">
                            {h}
                          </span>
                          <span className="text-fg-4">→</span>
                          <select
                            value={mapping[h] || "skip"}
                            onChange={(e) =>
                              setMapping((prev) => ({
                                ...prev,
                                [h]: e.target.value as Target,
                              }))
                            }
                            className="h-8 flex-1 rounded-md border border-border-input bg-surface-raised px-2 text-[12.5px] text-fg-1 outline-none focus:border-accent"
                          >
                            {TARGETS.map((t) => (
                              <option key={t} value={t}>
                                {t === "skip" ? "— skip —" : t}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                      Preview · {Math.min(prepared.length, 3)} of {prepared.length}
                    </div>
                    <ul className="flex flex-col gap-2">
                      {prepared.slice(0, 3).map((p, i) => (
                        <li
                          key={i}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-fg-2"
                        >
                          <span className="font-medium text-fg-1">{p.name}</span>
                          {p.company && <span>· {p.company}</span>}
                          {p.email && <span>· {p.email}</span>}
                          {p.phone && <span>· {p.phone}</span>}
                          {p.stage && p.stage !== "new" && (
                            <span className="rounded-xs bg-surface-2 px-1.5 py-px text-[10.5px] font-medium text-fg-3">
                              {p.stage}
                            </span>
                          )}
                        </li>
                      ))}
                      {prepared.length === 0 && (
                        <li className="text-[12.5px] text-fg-3">
                          No rows have a mapped <code className="font-mono">name</code> column yet.
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-lg border border-[var(--persimmon-500)]/30 bg-[var(--persimmon-100)] px-3 py-2 text-[12.5px] text-[var(--persimmon-500)]">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-none items-center gap-2 border-t border-border-subtle bg-surface-1/60 px-5 py-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <a
                href="data:text/csv;charset=utf-8,name,company,phone,email,stage,tags%0AMaya,Ferngrove Studio,+972 50 555 1234,maya@ferngrove.co,new,%22consulting;q2%22"
                download="atlas-leads-template.csv"
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg-1"
              >
                <Icon icon={Download} size={11} /> Template
              </a>
              <div className="ms-auto flex items-center gap-2">
                {progress && (
                  <span className="text-[11.5px] text-fg-3">
                    {progress.done}/{progress.total}
                  </span>
                )}
                <Button
                  variant="primary"
                  onClick={runImport}
                  disabled={!prepared.length || bulk.isPending}
                >
                  {bulk.isPending
                    ? "Importing…"
                    : prepared.length
                      ? `Import ${prepared.length} ${prepared.length === 1 ? "lead" : "leads"}`
                      : "Import"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
