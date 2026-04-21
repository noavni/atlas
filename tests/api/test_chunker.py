from api._core.chunker import chunk_blocks


def block(id: str, text: str, type: str = "paragraph") -> dict[str, object]:
    return {"id": id, "type": type, "text": text}


def test_empty_returns_nothing():
    assert chunk_blocks([], page_title="Page") == []


def test_single_short_block_becomes_one_chunk():
    blocks = [block("a", "Short note.")]
    chunks = chunk_blocks(blocks, page_title="Title")
    assert len(chunks) == 1
    assert chunks[0].source_ids == ["a"]
    assert "Title" in chunks[0].text


def test_headings_get_their_own_chunk():
    blocks = [
        block("h1", "Section A", type="heading"),
        block("p1", "Body under A."),
    ]
    chunks = chunk_blocks(blocks, page_title="Title")
    assert any("Section A" in c.text for c in chunks)
    assert any("Body under A" in c.text for c in chunks)


def test_many_short_blocks_merge_to_target():
    blocks = [block(f"b{i}", "x" * 200) for i in range(10)]  # ~50 tokens each
    chunks = chunk_blocks(blocks, page_title="T")
    # With target 250 tokens and each block ~50 tokens, expect ~2 chunks of ~5 each
    assert len(chunks) <= 3
    merged_ids = [bid for c in chunks for bid in c.source_ids]
    assert set(merged_ids) == {f"b{i}" for i in range(10)}


def test_huge_block_does_not_collapse_previous():
    blocks = [
        block("a", "x" * 200),  # ~50 tokens
        block("big", "y" * 2000),  # ~500 tokens — exceeds max alone
    ]
    chunks = chunk_blocks(blocks, page_title="T")
    # Either flushed 'a' before 'big' or merged them, but total text preserved
    text = " ".join(c.text for c in chunks)
    assert "x" * 200 in text
    assert "y" * 2000 in text


def test_heading_prefix_appears_in_later_chunks():
    blocks = [
        block("h", "Ideas", type="heading"),
        block("p", "A note under Ideas."),
    ]
    chunks = chunk_blocks(blocks, page_title="My Page")
    body = next(c for c in chunks if "A note under" in c.text)
    assert "My Page" in body.text
    assert "Ideas" in body.text
