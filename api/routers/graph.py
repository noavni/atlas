"""Knowledge graph endpoint.

Returns nodes + edges for a workspace at current scale (hundreds of pages at
most). Nodes are pages; edges are resolved links. For >~5k pages we'd switch
to paginated traversal and cluster on the client.
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from api._core.auth import UserContext, require_user
from api._core.supabase import user_client

router = APIRouter(prefix="/v1/graph", tags=["graph"])


class GraphNode(BaseModel):
    id: UUID
    label: str
    kind: Literal["page"] = "page"


class GraphEdge(BaseModel):
    source: UUID
    target: UUID
    count: int


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


@router.get("", response_model=GraphResponse)
def graph(
    workspace_id: UUID = Query(...),
    ctx: UserContext = Depends(require_user),
) -> GraphResponse:
    client = user_client(ctx.jwt)
    ws = str(workspace_id)

    pages = (
        client.table("pages")
        .select("id, title")
        .eq("workspace_id", ws)
        .is_("deleted_at", "null")
        .order("updated_at", desc=True)
        .limit(500)
        .execute()
    ).data or []
    nodes = [GraphNode(id=p["id"], label=p["title"]) for p in pages]

    links = (
        client.table("links")
        .select("source_page_id, target_page_id")
        .eq("workspace_id", ws)
        .not_.is_("target_page_id", "null")
        .limit(5000)
        .execute()
    ).data or []

    # Collapse multi-edge to count
    edge_counts: dict[tuple[str, str], int] = {}
    for row in links:
        key = (row["source_page_id"], row["target_page_id"])
        if key[0] == key[1]:
            continue
        edge_counts[key] = edge_counts.get(key, 0) + 1

    edges = [
        GraphEdge(source=src, target=tgt, count=count)
        for (src, tgt), count in edge_counts.items()
    ]
    return GraphResponse(nodes=nodes, edges=edges)
