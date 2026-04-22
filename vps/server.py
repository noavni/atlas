"""Atlas Hebrew STT worker — CPU-only, Windows-friendly.

Receives a signed audio URL from the Atlas drain worker, converts to 16kHz
mono WAV with ffmpeg, runs whisper.cpp, and PATCHes the transcript back
into `public.inbox_items` via Supabase REST.

Everything uses paths relative to this file so the service works the same
whether launched from the Start Menu, NSSM, or a PowerShell prompt.
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Literal

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent

# --- Config --------------------------------------------------------------

WORKER_SECRET = os.environ.get("WORKER_SECRET", "").strip()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SVC = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

MODEL_NAME = os.environ.get("WHISPER_MODEL", "ggml-large-v3-turbo-q5_0.bin")
MODEL_PATH = Path(os.environ.get("WHISPER_MODEL_PATH", str(ROOT / "models" / MODEL_NAME)))

# whisper.cpp release zips have shipped the binary under a few names over
# time — we probe each so setup.ps1 doesn't have to guess.
_CANDIDATE_BINS = [
    "whisper-cli.exe",
    "main.exe",
    "whisper.exe",
]
_BIN_DIRS = [ROOT / "whisper", ROOT / "bin"]

WHISPER_BIN = os.environ.get("WHISPER_BIN", "").strip()
if not WHISPER_BIN:
    for d in _BIN_DIRS:
        for name in _CANDIDATE_BINS:
            cand = d / name
            if cand.exists():
                WHISPER_BIN = str(cand)
                break
        if WHISPER_BIN:
            break

FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg").strip()
THREADS = int(os.environ.get("WHISPER_THREADS", "4"))
TIMEOUT_S = int(os.environ.get("TRANSCRIBE_TIMEOUT_S", "600"))
SCRATCH_DIR = Path(os.environ.get("SCRATCH_DIR", str(ROOT / "scratch")))
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

# --- Logging -------------------------------------------------------------

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s  %(levelname)-5s  %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("atlas-stt")

# --- FastAPI -------------------------------------------------------------

app = FastAPI(title="Atlas STT", version="1.0.0")


class TranscribeJob(BaseModel):
    item_id: str
    audio_url: str
    language: str = "he"
    # Optional hints: if the worker knows the content is primarily Hebrew,
    # we skip language detection for a small speed-up.
    skip_language_detection: bool = True


class TranscribeResult(BaseModel):
    ok: Literal[True] = True
    item_id: str
    chars: int
    duration_ms: int


@app.get("/health")
def health() -> dict:
    model_ok = MODEL_PATH.exists()
    bin_ok = bool(WHISPER_BIN) and Path(WHISPER_BIN).exists()
    return {
        "ok": model_ok and bin_ok,
        "model": str(MODEL_PATH),
        "model_present": model_ok,
        "binary": WHISPER_BIN,
        "binary_present": bin_ok,
        "threads": THREADS,
    }


@app.post("/transcribe", response_model=TranscribeResult)
def transcribe(
    job: TranscribeJob,
    x_worker_secret: str = Header(alias="x-worker-secret"),
) -> TranscribeResult:
    if not WORKER_SECRET:
        raise HTTPException(500, "Server missing WORKER_SECRET")
    if x_worker_secret != WORKER_SECRET:
        raise HTTPException(403, "Bad secret")
    if not SUPABASE_URL or not SUPABASE_SVC:
        raise HTTPException(500, "Server missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
    if not MODEL_PATH.exists():
        raise HTTPException(500, f"Whisper model missing at {MODEL_PATH}")
    if not WHISPER_BIN or not Path(WHISPER_BIN).exists():
        raise HTTPException(500, "whisper-cli binary not found — see setup.ps1")

    t0 = time.time()
    transcript = ""
    with tempfile.TemporaryDirectory(dir=str(SCRATCH_DIR)) as tmp:
        tmp_p = Path(tmp)
        src = tmp_p / "in.bin"
        wav = tmp_p / "in.wav"
        out_base = tmp_p / "out"

        # 1. Download the audio from Supabase signed URL
        log.info("[%s] downloading audio...", job.item_id)
        with httpx.stream(
            "GET",
            job.audio_url,
            timeout=httpx.Timeout(60.0, connect=15.0),
            follow_redirects=True,
        ) as r:
            r.raise_for_status()
            with open(src, "wb") as f:
                for chunk in r.iter_bytes():
                    f.write(chunk)
        log.info("[%s] audio %d bytes", job.item_id, src.stat().st_size)

        # 2. Convert to 16kHz mono WAV — whisper.cpp expects this exactly.
        subprocess.run(
            [
                FFMPEG_BIN,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(src),
                "-ar",
                "16000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(wav),
            ],
            check=True,
            timeout=60,
        )

        # 3. Run whisper.cpp.
        # -otxt writes <out>.txt; -nt strips timestamps from the txt output.
        cmd = [
            WHISPER_BIN,
            "-m",
            str(MODEL_PATH),
            "-f",
            str(wav),
            "-l",
            job.language,
            "-t",
            str(THREADS),
            "-otxt",
            "-of",
            str(out_base),
            "-nt",
        ]
        if job.skip_language_detection:
            # whisper.cpp uses `-l` for language so detection is already
            # skipped by passing a concrete language. Keeping the flag here
            # so we have a clean hook if we want auto-detect later.
            pass

        log.info("[%s] whisper: %s", job.item_id, " ".join(cmd))
        subprocess.run(cmd, check=True, timeout=TIMEOUT_S)
        txt_path = out_base.with_suffix(".txt")
        if not txt_path.exists():
            # Some whisper.cpp builds use `<of>.txt` vs `<of>.wav.txt`.
            alt = tmp_p / "out.wav.txt"
            if alt.exists():
                txt_path = alt
        if not txt_path.exists():
            raise HTTPException(500, "Whisper produced no output text")
        transcript = txt_path.read_text(encoding="utf-8", errors="replace").strip()

    elapsed_ms = int((time.time() - t0) * 1000)
    log.info(
        "[%s] transcript done (%d chars, %dms)",
        job.item_id,
        len(transcript),
        elapsed_ms,
    )

    # 4. PATCH the row back into Atlas.
    patch_body = {
        "transcript": transcript,
        "transcription_status": "done",
        "transcription_completed_at": "now()",
        "transcription_error": None,
    }
    r = httpx.patch(
        f"{SUPABASE_URL}/rest/v1/inbox_items",
        params={"id": f"eq.{job.item_id}"},
        headers={
            "apikey": SUPABASE_SVC,
            "authorization": f"Bearer {SUPABASE_SVC}",
            "content-type": "application/json",
            "prefer": "return=minimal",
        },
        json=patch_body,
        timeout=20,
    )
    if r.status_code >= 400:
        log.error("[%s] supabase patch failed: %s %s", job.item_id, r.status_code, r.text[:200])
        raise HTTPException(502, f"Supabase PATCH failed: {r.status_code}")

    return TranscribeResult(item_id=job.item_id, chars=len(transcript), duration_ms=elapsed_ms)
