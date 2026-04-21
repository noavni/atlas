"""Pydantic models — API contracts shared by routers.

Tables on the Postgres side match these one-to-one. Request bodies carry
`client_id` (UUID v4 generated on the frontend) so inserts are idempotent
through the idempotency middleware, and `version` for optimistic concurrency
on updates.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkflowState(str, Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"
    canceled = "canceled"


# --- workspaces ----------------------------------------------------------
class Workspace(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    owner_id: UUID
    created_at: datetime
    updated_at: datetime


class WorkspaceMember(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    workspace_id: UUID
    user_id: UUID
    role: Literal["owner", "member"]
    joined_at: datetime


class MeResponse(BaseModel):
    user_id: UUID
    email: str | None
    workspaces: list[Workspace]


# --- projects ------------------------------------------------------------
class Project(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    name: str
    description: str | None = None
    status: str
    rank: str
    created_at: datetime
    updated_at: datetime


class CreateProject(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None


class UpdateProject(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = None


# --- boards --------------------------------------------------------------
class Board(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    project_id: UUID
    name: str
    rank: str
    created_at: datetime
    updated_at: datetime


class CreateBoard(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)


# --- columns -------------------------------------------------------------
class Column(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    board_id: UUID
    name: str
    rank: str
    default_workflow_state: WorkflowState | None = None
    created_at: datetime
    updated_at: datetime


class CreateColumn(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=100)
    default_workflow_state: WorkflowState | None = None


class UpdateColumn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    default_workflow_state: WorkflowState | None = None


# --- cards ---------------------------------------------------------------
class Card(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    project_id: UUID
    board_id: UUID
    column_id: UUID
    title: str
    description: str | None = None
    workflow_state: WorkflowState
    rank: str
    assignee_id: UUID | None = None
    due_at: datetime | None = None
    version: int
    created_at: datetime
    updated_at: datetime


class CreateCard(BaseModel):
    id: UUID | None = None
    column_id: UUID
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    workflow_state: WorkflowState | None = None
    assignee_id: UUID | None = None
    due_at: datetime | None = None


class UpdateCard(BaseModel):
    """Partial update. ``version`` is required so concurrent writers fail
    loudly via VersionConflict."""

    version: int
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    workflow_state: WorkflowState | None = None
    assignee_id: UUID | None = None
    due_at: datetime | None = None


class RankRequest(BaseModel):
    before: str | None = None
    after: str | None = None


class MoveCardRequest(BaseModel):
    column_id: UUID
    before: str | None = None
    after: str | None = None
    version: int
