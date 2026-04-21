from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from api._core.settings import get_settings


@dataclass(frozen=True)
class EmbeddingResult:
    model: str
    dimension: int
    vectors: list[list[float]]


class EmbeddingProvider(Protocol):
    name: str
    model: str
    dimension: int

    async def embed(self, texts: list[str]) -> EmbeddingResult: ...


def get_embedding_provider() -> EmbeddingProvider:
    """Return the configured provider. Default: Voyage voyage-3-large."""
    settings = get_settings()
    if settings.voyage_api_key:
        from .voyage import VoyageEmbeddingProvider

        return VoyageEmbeddingProvider(settings.voyage_api_key)
    # Missing key — ship a no-op so worker doesn't crash; real traffic blocks
    # on Voyage being configured, which is the intent.
    from .noop import NoOpEmbeddingProvider

    return NoOpEmbeddingProvider()
