"""Dataset loading and cleaning utilities."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable


def load_dataset(path: str | Path) -> list[dict[str, Any]]:
    dataset_path = Path(path)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    if dataset_path.suffix.lower() == ".json":
        import json

        return list(json.loads(dataset_path.read_text(encoding="utf-8")))

    if dataset_path.suffix.lower() in {".csv", ".tsv"}:
        import csv

        delimiter = "\t" if dataset_path.suffix.lower() == ".tsv" else ","
        with dataset_path.open(newline="", encoding="utf-8") as handle:
            return list(csv.DictReader(handle, delimiter=delimiter))

    raise ValueError(f"Unsupported dataset format: {dataset_path.suffix}")


def clean_records(records: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for record in records:
        normalized = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in record.items()
            if value not in (None, "")
        }
        if normalized:
            cleaned.append(normalized)
    return cleaned
