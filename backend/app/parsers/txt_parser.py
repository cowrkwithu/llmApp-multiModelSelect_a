from pathlib import Path


def parse_txt(file_path: str | Path) -> str:
    return Path(file_path).read_text(encoding="utf-8")
