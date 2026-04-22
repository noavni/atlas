# Atlas STT — Windows VPS

Hebrew-first voice-note transcription worker. CPU-only (whisper.cpp),
single FastAPI endpoint, runs as a Windows Service.

## What it does

1. Atlas on Vercel enqueues a `transcription` job via pgmq.
2. The Vercel drain POSTs `{ item_id, audio_url }` to `https://<your-vps>/transcribe`.
3. This server downloads the audio, runs whisper.cpp locally, and
   PATCHes the transcript back into `public.inbox_items` via the
   Supabase service-role key.

No queue service on the VPS, no database on the VPS, no state on the
VPS. It's a stateless CPU box. If it crashes, the job re-queues.

## One-click install

1. RDP into your Windows VPS.
2. Copy this entire `vps/` folder somewhere (e.g. `C:\atlas-stt\`).
3. Open PowerShell **as Administrator** in that folder.
4. Run:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\setup.ps1
   ```

5. When prompted, fill in `.env` with:
   - `WORKER_SECRET` — pick a long random string (`[System.Web.Security.Membership]::GeneratePassword(48,8)` in PowerShell)
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — the service role key
6. Setup installs Python, ffmpeg, NSSM, downloads whisper.cpp + the
   Hebrew model, creates a venv, registers `AtlasSTT` as a Windows
   Service, and runs a health check.

Re-running `setup.ps1` is safe — everything is idempotent.

## Files required on the VPS

Just this folder. Six files, nothing else:

```
vps/
├── server.py
├── requirements.txt
├── .env.example        # setup.ps1 copies to .env and opens notepad
├── setup.ps1           # one-click installer
├── uninstall-service.ps1
├── run-dev.ps1         # optional: run in terminal, no service
├── Caddyfile.example   # optional: if you go Caddy-over-port-443
└── README.md           # this
```

After install, `models/`, `whisper/`, `.venv/`, `scratch/` appear as
siblings.

## Exposing the service publicly

Pick one, both are fine:

### Option A — Cloudflare Tunnel (recommended, no ports)

```powershell
winget install Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create atlas-stt
cloudflared tunnel route dns atlas-stt atlas-stt.yourdomain.com
cloudflared tunnel --url http://127.0.0.1:8080 run atlas-stt
# Run as service:
cloudflared service install
```

No inbound ports open, free, auto-HTTPS.

### Option B — Caddy + port 443

1. `winget install CaddyServer.Caddy`
2. Point `atlas-stt.yourdomain.com` DNS at the VPS public IP.
3. Open ports 80 + 443 in Windows Firewall + any cloud security group.
4. Copy `Caddyfile.example` → `C:\Caddy\Caddyfile`, edit the hostname.
5. `caddy run --config C:\Caddy\Caddyfile` (or register as service).

Caddy auto-provisions a Let's Encrypt cert.

## Atlas-side environment

Add these to Vercel project env (Production):

```
VPS_URL=https://atlas-stt.yourdomain.com
VPS_WORKER_SECRET=<the same WORKER_SECRET from .env>
```

The Atlas drain worker will pick them up; nothing else is needed on
Vercel.

## Ops

- **Logs**: `service.log` and `service.err.log` next to `server.py`.
- **Status**: `Get-Service AtlasSTT`
- **Restart**: `Restart-Service AtlasSTT`
- **Health**: `Invoke-RestMethod http://127.0.0.1:8080/health`
- **Remove**: `.\uninstall-service.ps1`

## Benchmark / quality tuning

Default model is `ggml-large-v3-turbo-q5_0.bin` — the best Hebrew WER
for a CPU-practical model size (~574MB on disk, ~1.5GB RAM at infer).
Expect ~2× realtime on a 4 vCPU box.

If transcription is too slow for your VPS, swap the model by:
1. Download another: e.g. `ggml-medium-q5_0.bin` from
   https://huggingface.co/ggerganov/whisper.cpp/tree/main
2. `.env` → `WHISPER_MODEL=ggml-medium-q5_0.bin`
3. `Restart-Service AtlasSTT`

To benchmark Hebrew WER, record 10 short clips, transcribe each, and
compare against manual ground-truth with `pip install jiwer`.

## Security notes

- `/transcribe` requires the `X-Worker-Secret` header to match `WORKER_SECRET`.
- Audio URLs are short-lived Supabase signed URLs (10 min TTL).
- No data is kept on the VPS after a job finishes — `scratch/` is wiped
  per-request via `tempfile.TemporaryDirectory`.
- The Supabase service-role key is only written to `.env`, never logged.

## Uninstall

```powershell
.\uninstall-service.ps1
# Then delete C:\atlas-stt\ if you want the files gone too.
```
