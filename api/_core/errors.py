"""Typed errors the handlers raise. Kept in one place so the middleware can
map them uniformly to HTTP responses.
"""

from __future__ import annotations

from fastapi import HTTPException, status


class VersionConflict(HTTPException):
    def __init__(self, current: dict[str, object] | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "version_conflict", "current": current},
        )


class NotFound(HTTPException):
    def __init__(self, what: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "what": what},
        )


class Forbidden(HTTPException):
    def __init__(self, reason: str = "not a member of this workspace") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden", "reason": reason},
        )
