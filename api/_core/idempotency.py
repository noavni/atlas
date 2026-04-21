"""Idempotency middleware.

Non-GET requests may carry an ``Idempotency-Key`` header. We hash
`(user_id, method, path, key)` and:

  * On first see: record the request, let the handler run, persist the
    response, return it.
  * On replay: return the persisted response as-is.

The cache lives in ``public.request_log`` (service-role). Rows older than
7 days are purged by pg_cron (added in a later migration when data volume
justifies it).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from api._core.supabase import service_client

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


@dataclass
class _Cached:
    status_code: int
    body: bytes


async def _lookup(key: str) -> _Cached | None:
    client = service_client()
    try:
        res = (
            client.table("request_log")
            .select("status_code, response_body")
            .eq("key", key)
            .limit(1)
            .execute()
        )
    except Exception:
        return None
    rows: list[dict[str, Any]] = res.data or []
    if not rows:
        return None
    row = rows[0]
    body_raw = row.get("response_body")
    body_bytes = json.dumps(body_raw).encode() if body_raw is not None else b""
    return _Cached(status_code=int(row["status_code"]), body=body_bytes)


async def _store(key: str, user_id: str | None, method: str, path: str, status_code: int, body: bytes) -> None:
    payload = None
    if body:
        try:
            payload = json.loads(body)
        except Exception:
            payload = {"raw": body.decode(errors="ignore")}
    client = service_client()
    try:
        client.table("request_log").upsert(
            {
                "key": key,
                "user_id": user_id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "response_body": payload,
            },
            on_conflict="key",
        ).execute()
    except Exception:
        # Never let idempotency persistence break a handler
        pass


class IdempotencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in SAFE_METHODS:
            return await call_next(request)

        key = request.headers.get("idempotency-key")
        if not key:
            return await call_next(request)

        # Derive user_id opportunistically; if the token is malformed the
        # handler will reject the request anyway.
        auth = request.headers.get("authorization") or ""
        user_id: str | None = None
        if auth.lower().startswith("bearer "):
            try:
                from api._core.auth import _decode_unverified  # local import avoids cycle

                claims = _decode_unverified(auth.split(" ", 1)[1].strip())
                sub = claims.get("sub")
                if isinstance(sub, str):
                    user_id = sub
            except Exception:
                user_id = None

        composite = f"{user_id or 'anon'}:{request.method}:{request.url.path}:{key}"
        cached = await _lookup(composite)
        if cached is not None:
            return Response(
                content=cached.body,
                status_code=cached.status_code,
                media_type="application/json",
            )

        response = await call_next(request)

        # Stream body to buffer so we can persist + resend
        body_chunks: list[bytes] = []
        async for chunk in response.body_iterator:
            body_chunks.append(chunk)
        body = b"".join(body_chunks)
        await _store(
            key=composite,
            user_id=user_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            body=body,
        )
        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
