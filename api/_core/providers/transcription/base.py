"""Speech-to-text provider interface.

Deferred until the user enables STT. All call sites go through
``get_transcription_provider()`` which returns ``NoOpTranscriptionProvider``
by default. When STT is enabled we wire ``gpt-4o-transcribe`` first, then
optionally ElevenLabs Scribe v2 for best-in-class Hebrew WER.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str | None = None
    duration_seconds: float | None = None


class TranscriptionProvider(Protocol):
    name: str

    async def transcribe(self, *, audio_bytes: bytes, mime_type: str) -> TranscriptionResult: ...


def get_transcription_provider() -> TranscriptionProvider:
    from .noop import NoOpTranscriptionProvider

    return NoOpTranscriptionProvider()
