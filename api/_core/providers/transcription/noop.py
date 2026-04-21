from __future__ import annotations

from .base import TranscriptionResult


class NoOpTranscriptionProvider:
    """Default provider while STT is deferred. Returns an empty transcript
    so call sites remain uniform — the worker simply leaves ``transcript``
    NULL on the inbox row.
    """

    name = "noop"

    async def transcribe(self, *, audio_bytes: bytes, mime_type: str) -> TranscriptionResult:
        del audio_bytes, mime_type
        return TranscriptionResult(text="")
