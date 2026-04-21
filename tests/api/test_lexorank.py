import pytest

from api._core import lexorank


def test_initial_is_midpoint():
    r = lexorank.initial()
    assert r.startswith("0|")
    assert r == "0|V"  # mid of 62-char alphabet (index 31)


def test_between_none_none_equals_initial():
    assert lexorank.between(None, None) == lexorank.initial()


def test_between_produces_lexicographic_ordering():
    a = lexorank.between(None, None)
    b = lexorank.between(a, None)
    c = lexorank.between(None, a)
    assert c < a < b


def test_between_inserts_between_neighbours():
    left = lexorank.between(None, None)
    right = lexorank.between(left, None)
    middle = lexorank.between(left, right)
    assert left < middle < right


def test_between_many_inserts_maintain_order():
    ranks: list[str] = []
    r = lexorank.initial()
    ranks.append(r)
    # Ten appends
    for _ in range(10):
        r = lexorank.between(r, None)
        ranks.append(r)
    assert ranks == sorted(ranks)
    # Ten prepends
    head = ranks[0]
    for _ in range(10):
        head = lexorank.between(None, head)
        ranks.insert(0, head)
    assert ranks == sorted(ranks)


def test_between_rejects_bad_order():
    left = lexorank.between(None, None)
    right = lexorank.between(left, None)
    with pytest.raises(ValueError):
        lexorank.between(right, left)


def test_between_subdivides_without_collapsing():
    left = "0|a"
    right = "0|b"
    mid = lexorank.between(left, right)
    assert left < mid < right
