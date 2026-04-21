"""Authentication: extract the caller's Supabase user id from the JWT.

Strategy: decode the JWT without signature verification to pull `sub` and
`email`, then rely on Postgres RLS as the real backstop — every data access
goes through a user-JWT-scoped Supabase client and gets verified by Supabase
server-side. For an internal two-user tool this is a solid defence in depth
without shipping the JWT secret into the backend.

Verified decoding can be added by setting SUPABASE_JWT_SECRET and switching
to `jwt.decode(token, secret, algorithms=["HS256"])` — kept out for now to
minimise surface area.
"""

from __future__ import annotations

import base64
import json
from dataclasses import dataclass

from fastapi import Header, HTTPException, status


@dataclass(frozen=True)
class UserContext:
    user_id: str
    email: str | None
    jwt: str


def _decode_unverified(token: str) -> dict[str, object]:
    try:
        _, payload_b64, _ = token.split(".")
        # pad to multiple of 4
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        raw = base64.urlsafe_b64decode(padded)
        return json.loads(raw)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="malformed bearer token",
        ) from exc


def require_user(authorization: str | None = Header(default=None)) -> UserContext:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
        )
    token = authorization.split(" ", 1)[1].strip()
    claims = _decode_unverified(token)
    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token missing subject",
        )
    email = claims.get("email")
    return UserContext(user_id=sub, email=email if isinstance(email, str) else None, jwt=token)
