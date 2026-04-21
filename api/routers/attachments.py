from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from api._core.auth import UserContext, require_user
from api._core.errors import NotFound
from api._core.supabase import user_client

router = APIRouter(prefix="/v1/attachments", tags=["attachments"])

ParentKind = Literal["inbox", "card", "page", "block"]


class UploadURLRequest(BaseModel):
    workspace_id: UUID
    parent_kind: ParentKind
    parent_id: UUID
    mime_type: str = Field(min_length=1, max_length=200)
    filename: str | None = None


class UploadURLResponse(BaseModel):
    upload_url: str
    token: str
    path: str


class FinalizeBody(BaseModel):
    id: UUID | None = None
    workspace_id: UUID
    parent_kind: ParentKind
    parent_id: UUID
    storage_path: str
    mime_type: str
    size_bytes: int | None = None


class Attachment(BaseModel):
    id: UUID
    workspace_id: UUID
    storage_path: str
    mime_type: str | None = None
    size_bytes: int | None = None
    parent_kind: ParentKind
    parent_id: UUID
    created_at: datetime


@router.post("/upload-url", response_model=UploadURLResponse)
def create_upload_url(body: UploadURLRequest, ctx: UserContext = Depends(require_user)) -> UploadURLResponse:
    client = user_client(ctx.jwt)
    now = datetime.now(timezone.utc)
    ext = _ext_for(body.mime_type, body.filename)
    path = f"{body.workspace_id}/{now.year}/{now.month:02d}/{uuid4()}{ext}"

    # supabase-py returns a signed upload URL for authenticated users
    signed = client.storage.from_("attachments").create_signed_upload_url(path)
    return UploadURLResponse(
        upload_url=signed["signed_url"],
        token=signed.get("token", ""),
        path=path,
    )


@router.post("/finalize", response_model=Attachment, status_code=201)
def finalize(body: FinalizeBody, ctx: UserContext = Depends(require_user)) -> Attachment:
    client = user_client(ctx.jwt)
    row = {
        "id": str(body.id or uuid4()),
        "workspace_id": str(body.workspace_id),
        "storage_path": body.storage_path,
        "mime_type": body.mime_type,
        "size_bytes": body.size_bytes,
        "parent_kind": body.parent_kind,
        "parent_id": str(body.parent_id),
        "created_by": ctx.user_id,
    }
    rows = client.table("attachments").insert(row).execute().data or []
    if not rows:
        raise NotFound("attachment insert failed")
    return Attachment.model_validate(rows[0])


def _ext_for(mime: str, filename: str | None) -> str:
    if filename and "." in filename:
        return "." + filename.rsplit(".", 1)[-1].lower()
    mapping = {
        "audio/webm": ".webm",
        "audio/mp4": ".m4a",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }
    return mapping.get(mime, "")
