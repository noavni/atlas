"""Voyage AI embedding provider.

Uses the REST API directly (no SDK dep) so we stay light on the Vercel
function bundle. voyage-3-large is Anthropic's recommended pairing with
Claude; we request 1024-dim vectors to match the ``halfvec(1024)`` column.
"""

from __future__ import annotations

import httpx

from .base import EmbeddingResult


class VoyageEmbeddingProvider:
    name = "voyage"
    model = "voyage-3-large"
    dimension = 1024

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            return EmbeddingResult(model=self.model, dimension=self.dimension, vectors=[])
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.voyageai.com/v1/embeddings",
                headers={
                    "authorization": f"Bearer {self._api_key}",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "input": texts,
                    "output_dimension": self.dimension,
                    "output_dtype": "float",
                    "input_type": "document",
                },
            )
            res.raise_for_status()
            body = res.json()
        vectors = [item["embedding"] for item in body["data"]]
        return EmbeddingResult(model=self.model, dimension=self.dimension, vectors=vectors)
