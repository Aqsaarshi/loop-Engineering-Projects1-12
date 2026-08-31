import pytest

from buggy_code import get_list_item


def test_valid_index_returns_item():
    items = [10, 20, 30]
    result = get_list_item(items, 1)
    assert result == 20


def test_last_valid_index_returns_item():
    items = [10, 20, 30]
    result = get_list_item(items, 2)
    assert result == 30


def test_index_equal_to_len_raises_indexerror():
    items = [10, 20, 30]
    with pytest.raises(IndexError):
        get_list_item(items, 3)


def test_negative_index_raises_indexerror():
    items = [10, 20, 30]
    with pytest.raises(IndexError):
        get_list_item(items, -1)