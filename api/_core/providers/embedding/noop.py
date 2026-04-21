from __future__ import annotations

from .base import EmbeddingResult


class NoOpEmbeddingProvider:
    """Inactive provider used when VOYAGE_API_KEY is missing. Returns empty
    vectors so the worker can skip the write without exploding.
    """

    name = "noop"
    model = "none"
    dimension = 1024

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        return EmbeddingResult(model=self.model, dimension=self.dimension, vectors=[])
