"""JSON helpers: coerce request values and stringify large integers for JavaScript."""

JS_MAX_SAFE_INTEGER = 9007199254740991


def to_int(value):
    if value is None:
        raise ValueError("Expected a numeric value")
    if isinstance(value, bool):
        raise ValueError("Expected a numeric value")
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        return int(value.strip())
    if isinstance(value, float):
        return int(value)
    raise ValueError(f"Cannot convert {type(value).__name__} to int")


def stringify_large_ints(obj):
    """Recursively convert ints beyond JS safe range to decimal strings."""
    if isinstance(obj, dict):
        return {k: stringify_large_ints(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [stringify_large_ints(v) for v in obj]
    if isinstance(obj, int) and abs(obj) > JS_MAX_SAFE_INTEGER:
        return str(obj)
    return obj
