from api._core.blocks.extract import diff, extract
from api._core.blocks.linkparser import parse_links


PAGE = "page-id"
WS = "ws-id"


def test_extract_flat_paragraphs():
    doc = {
        "type": "doc",
        "content": [
            {"type": "paragraph", "attrs": {"id": "p1"}, "content": [{"type": "text", "text": "Hello"}]},
            {"type": "paragraph", "attrs": {"id": "p2"}, "content": [{"type": "text", "text": "World"}]},
        ],
    }
    blocks = extract(doc=doc, page_id=PAGE, workspace_id=WS)
    assert [b.id for b in blocks] == ["p1", "p2"]
    assert [b.text for b in blocks] == ["Hello", "World"]
    assert blocks[0].rank < blocks[1].rank


def test_extract_nested_list():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "bulletList",
                "attrs": {"id": "l1"},
                "content": [
                    {
                        "type": "listItem",
                        "attrs": {"id": "li1"},
                        "content": [
                            {"type": "paragraph", "attrs": {"id": "p1"}, "content": [{"type": "text", "text": "Item"}]}
                        ],
                    }
                ],
            }
        ],
    }
    blocks = extract(doc=doc, page_id=PAGE, workspace_id=WS)
    types = [b.type for b in blocks]
    assert "bulletList" in types and "listItem" in types and "paragraph" in types
    li = next(b for b in blocks if b.id == "li1")
    assert li.parent_block_id == "l1"
    assert li.depth == 1
    p = next(b for b in blocks if b.id == "p1")
    assert p.parent_block_id == "li1"
    assert p.depth == 2


def test_extract_generates_id_when_missing():
    doc = {
        "type": "doc",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": "x"}]}],
    }
    blocks = extract(doc=doc, page_id=PAGE, workspace_id=WS)
    assert len(blocks) == 1 and blocks[0].id  # uuid generated


def test_diff_detects_changes():
    existing = [
        {"id": "a", "type": "paragraph", "text": "old", "parent_block_id": None, "rank": "0|V", "depth": 0, "attrs": {}},
        {"id": "b", "type": "paragraph", "text": "goodbye", "parent_block_id": None, "rank": "0|h", "depth": 0, "attrs": {}},
    ]
    doc = {
        "type": "doc",
        "content": [
            {"type": "paragraph", "attrs": {"id": "a"}, "content": [{"type": "text", "text": "new"}]},
            {"type": "paragraph", "attrs": {"id": "c"}, "content": [{"type": "text", "text": "fresh"}]},
        ],
    }
    extracted = extract(doc=doc, page_id=PAGE, workspace_id=WS)
    inserts, updates, deletes = diff(existing=existing, extracted=extracted)
    assert {b.id for b in inserts} == {"c"}
    assert {b.id for b in updates} == {"a"}
    assert set(deletes) == {"b"}


def test_parse_simple_link():
    links = parse_links("See [[Beta]] for context.")
    assert len(links) == 1
    assert links[0].link_text == "Beta"
    assert links[0].display_text == "Beta"


def test_parse_aliased_link():
    links = parse_links("Visit [[Beta|the other note]].")
    assert len(links) == 1
    assert links[0].link_text == "Beta"
    assert links[0].display_text == "the other note"


def test_parse_multiple_links_and_ignore_malformed():
    links = parse_links("[[A]] and [B] and [[]] and [[C]]")
    assert [l.link_text for l in links] == ["A", "C"]
