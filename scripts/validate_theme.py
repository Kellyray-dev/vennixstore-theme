#!/usr/bin/env python3
"""
Structural validation for the VennixStore theme.

theme-check covers Liquid and JSON *syntax*. It does not check the things that
actually break a theme after a settings rename:

  * settings written into a template that no longer exist in the section schema
  * block types written into a template the section does not declare
  * select values that are not one of the declared options
  * `settings.<id>` referenced in Liquid but missing from settings_schema.json
  * assets, snippets or sections referenced by name but absent from the repo

Run it locally with `python3 scripts/validate_theme.py`, or let CI run it
(.github/workflows/theme-check.yml). Exits non-zero on the first class of problem
found so a broken template can never reach a deploy.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCHEMA_RE = re.compile(r"\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}", re.S)
ASSET_RE = re.compile(r"'([A-Za-z0-9_.-]+\.(?:css|js|jpg|jpeg|png|webp|svg|woff2?))'\s*\|\s*asset_url")
RENDER_RE = re.compile(r"\{%-?\s*(?:render|include)\s+'([a-zA-Z0-9_-]+)'")
SECTION_RE = re.compile(r"\{%-?\s*section\s+'([a-zA-Z0-9_-]+)'")
GLOBAL_SETTING_RE = re.compile(r"(?<![.\w])settings\.([a-zA-Z0-9_]+)")
APP_BLOCK_PREFIX = "shopify://apps/"

problems: list[str] = []


def note(message: str) -> None:
    problems.append(message)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_editor_header(text: str) -> str:
    """Shopify's theme editor prepends a /* auto-generated */ banner to some JSON files."""
    return re.sub(r"^/\*.*?\*/\s*", "", text, flags=re.S)


def without_schema(text: str) -> str:
    return SCHEMA_RE.sub("", text)


def section_schema(path: Path) -> dict | None:
    if not path.exists():
        return None
    match = SCHEMA_RE.search(read(path))
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        note(f"{path.relative_to(ROOT)}: section schema is not valid JSON ({exc})")
        return None


def check_json_files() -> list[tuple[Path, dict]]:
    """Parse every theme JSON file; return the template/section-group descriptors."""
    descriptors: list[tuple[Path, dict]] = []
    for path in sorted(ROOT.rglob("*.json")):
        if ".git" in path.parts:
            continue
        try:
            data = json.loads(strip_editor_header(read(path)))
        except json.JSONDecodeError as exc:
            note(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith(("templates/", "sections/")) and isinstance(data, dict) and "sections" in data:
            descriptors.append((path, data))
    return descriptors


def check_settings_schema() -> set[str]:
    path = ROOT / "config" / "settings_schema.json"
    defined: set[str] = set()
    for group in json.loads(read(path)):
        for setting in group.get("settings", []):
            if "id" in setting:
                defined.add(setting["id"])

    for path in list(ROOT.glob("layout/*.liquid")) + list(ROOT.glob("snippets/*.liquid")) + list(
        ROOT.glob("sections/*.liquid")
    ):
        for setting_id in sorted(set(GLOBAL_SETTING_RE.findall(without_schema(read(path))))):
            if setting_id not in defined:
                note(f"{path.relative_to(ROOT)}: references settings.{setting_id}, not defined in settings_schema.json")
    return defined


def check_descriptors(descriptors: list[tuple[Path, dict]]) -> None:
    for path, data in descriptors:
        rel = path.relative_to(ROOT).as_posix()
        for section_id, section in data.get("sections", {}).items():
            section_type = section.get("type")
            if not section_type:
                continue
            section_path = ROOT / "sections" / f"{section_type}.liquid"
            schema = section_schema(section_path)
            if schema is None:
                if not section_path.exists():
                    note(f"{rel}: section '{section_id}' points at missing sections/{section_type}.liquid")
                continue

            valid_settings = {s["id"] for s in schema.get("settings", []) if "id" in s}
            for key in sorted(set(section.get("settings", {})) - valid_settings):
                note(f"{rel}: section '{section_id}' sets unknown setting '{key}'")

            valid_blocks = {b["type"] for b in schema.get("blocks", []) if "type" in b}
            for block_id, block in section.get("blocks", {}).items():
                block_type = block.get("type", "")
                # Theme app extension blocks are declared by the app, not the section.
                if block_type.startswith(APP_BLOCK_PREFIX) or not valid_blocks:
                    continue
                if block_type not in valid_blocks:
                    note(f"{rel}: block '{section_id}.{block_id}' has unknown type '{block_type}'")

            options = {
                s["id"]: {o["value"] for o in s.get("options", [])}
                for s in schema.get("settings", [])
                if s.get("type") == "select" and "id" in s
            }
            for key, allowed in options.items():
                value = section.get("settings", {}).get(key)
                if value is not None and allowed and value not in allowed:
                    note(f"{rel}: section '{section_id}' setting '{key}' = '{value}' is not one of {sorted(allowed)}")

        for order_key in data.get("sections", {}):
            if order_key not in data.get("order", []):
                note(f"{rel}: section '{order_key}' is declared but missing from 'order'")
        for order_key in data.get("order", []):
            if order_key not in data.get("sections", {}):
                note(f"{rel}: 'order' references undeclared section '{order_key}'")


def check_references() -> None:
    liquid = list(ROOT.glob("layout/*.liquid")) + list(ROOT.glob("sections/*.liquid")) + list(
        ROOT.glob("snippets/*.liquid")
    ) + list(ROOT.glob("templates/*.liquid")) + list(ROOT.glob("templates/customers/*.liquid"))
    blob = "\n".join(read(p) for p in liquid)

    for asset in sorted(set(ASSET_RE.findall(blob))):
        if not (ROOT / "assets" / asset).exists():
            note(f"asset '{asset}' is referenced but assets/{asset} does not exist")

    for snippet in sorted(set(RENDER_RE.findall(blob))):
        if not (ROOT / "snippets" / f"{snippet}.liquid").exists():
            note(f"snippet '{snippet}' is rendered but snippets/{snippet}.liquid does not exist")

    for section in sorted(set(SECTION_RE.findall(blob))):
        if not (ROOT / "sections" / f"{section}.liquid").exists():
            note(f"section '{section}' is referenced but sections/{section}.liquid does not exist")


def main() -> int:
    check_json_files_and_descriptors()
    check_settings_schema()
    check_references()

    if problems:
        print(f"FAILED — {len(problems)} problem(s):\n")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    print("OK — template JSON, section schemas, settings and asset references are consistent.")
    return 0


def check_json_files_and_descriptors() -> None:
    check_descriptors(check_json_files())


if __name__ == "__main__":
    sys.exit(main())
