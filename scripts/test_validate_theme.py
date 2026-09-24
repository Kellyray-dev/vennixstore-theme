#!/usr/bin/env python3
"""Regression tests for scripts/validate_theme.py.

validate_theme.py is the structural gate the CI workflow runs. Until now nothing in the
repo proved it still worked: a bug that made it scan node_modules/ shipped for an unknown
period, and the only evidence that the gate catches anything lived in prose in
reports/audits/2026-09-11-theme-audit.md.

Every case below copies the real theme into a temp directory, injects one fault, runs the
real script as a subprocess, and asserts both the exit code and the message. Nothing here
re-implements the checker — a test that copied its logic would pass even if the checker
were deleted.

Fault injection is strict on purpose: `replace_once` raises if its anchor is missing and
`json_transform` raises if a path it expects is absent, so a mutation that silently fails
to apply shows up as an error here rather than as a quietly-passing test.

Run:  python3 scripts/test_validate_theme.py
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = Path("scripts") / "validate_theme.py"
BANNER = re.compile(r"^/\*.*?\*/\s*", re.S)

# Directories that are not part of the theme and must never be copied into the fixtures.
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "dist", "build", "coverage"}

# Real anchor in sections/page.liquid (line 18 of the shipped file).
PAGE_ANCHOR = '<div class="page-width page-width--narrow section-{{ section.id }}-padding">'

failures: list[str] = []
checks = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global checks
    checks += 1
    if condition:
        print(f"  PASS  {label}")
    else:
        failures.append(label)
        print(f"  FAIL  {label}{f' — {detail}' if detail else ''}")


def replace_once(text: str, old: str, new: str) -> str:
    """Substitute exactly one occurrence, or raise — never a silent no-op."""
    if text.count(old) != 1:
        raise AssertionError(f"anchor found {text.count(old)} times, expected 1: {old[:60]!r}")
    return text.replace(old, new)


def json_transform(text: str, edit) -> str:
    """Parse a theme JSON file (editor banner and all), apply `edit(data)`, re-serialize."""
    banner_match = re.match(r"^/\*.*?\*/\s*", text, flags=re.S)
    banner = banner_match.group(0) if banner_match else ""
    data = json.loads(BANNER.sub("", text))
    edit(data)
    return banner + json.dumps(data, indent=2) + "\n"


class Theme:
    """A throwaway copy of the real theme, with per-file snapshot/restore."""

    def __init__(self, dest: Path) -> None:
        self.root = dest
        self._snapshots: dict[Path, str] = {}
        shutil.copytree(ROOT, dest, ignore=shutil.ignore_patterns(*SKIP_DIRS))

    def path(self, *parts: str) -> Path:
        return self.root.joinpath(*parts)

    def mutate(self, relative: str, transform) -> None:
        """Write `transform(original_text)` to the file, remembering the original."""
        target = self.path(relative)
        if target not in self._snapshots:
            self._snapshots[target] = target.read_text(encoding="utf-8")
        updated = transform(self._snapshots[target])
        if updated == self._snapshots[target]:
            raise AssertionError(f"mutation produced no change to {relative}")
        target.write_text(updated, encoding="utf-8")

    def restore(self) -> None:
        for target, original in self._snapshots.items():
            target.write_text(original, encoding="utf-8")
        self._snapshots.clear()

    def run(self) -> tuple[int, str]:
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=self.root,
            capture_output=True,
            text=True,
            check=False,
        )
        return result.returncode, result.stdout + result.stderr


# ---------------------------------------------------------------- fault injectors

def unknown_setting(theme: Theme) -> str:
    def edit(data: dict) -> None:
        data["sections"]["disclosures"]["settings"]["setting_that_does_not_exist"] = True

    theme.mutate("templates/product.json", lambda t: json_transform(t, edit))
    return "unknown setting 'setting_that_does_not_exist'"


def unknown_block_type(theme: Theme) -> str:
    def edit(data: dict) -> None:
        block = data["sections"]["vennix_announcement_bar_wb9ayn"]["blocks"]
        block["bogus_block"] = {"type": "not_a_real_block_type"}

    theme.mutate("sections/header-group.json", lambda t: json_transform(t, edit))
    return "unknown type 'not_a_real_block_type'"


def out_of_enum_select(theme: Theme) -> str:
    def edit(data: dict) -> None:
        data["sections"]["related-products"]["settings"]["image_ratio"] = "not_a_real_ratio"

    theme.mutate("templates/product.json", lambda t: json_transform(t, edit))
    return "is not one of"


def missing_section_file(theme: Theme) -> str:
    def edit(data: dict) -> None:
        assert data["sections"]["main"]["type"] == "main-page"
        data["sections"]["main"]["type"] = "section-that-does-not-exist"

    theme.mutate("templates/page.json", lambda t: json_transform(t, edit))
    return "points at missing sections/section-that-does-not-exist.liquid"


def missing_from_order(theme: Theme) -> str:
    def edit(data: dict) -> None:
        assert data["order"] == ["main"]
        data["order"] = []

    theme.mutate("templates/page.json", lambda t: json_transform(t, edit))
    return "missing from 'order'"


def undeclared_in_order(theme: Theme) -> str:
    def edit(data: dict) -> None:
        data["order"].append("section_never_declared")

    theme.mutate("templates/page.json", lambda t: json_transform(t, edit))
    return "references undeclared section 'section_never_declared'"


def invalid_json(theme: Theme) -> str:
    theme.mutate("templates/page.json", lambda _: '{"sections": {"main": ')
    return "invalid JSON"


def broken_section_schema(theme: Theme) -> str:
    # Must target a section that some template actually references: validate_theme.py only
    # parses a section's {% schema %} while checking the descriptors that place it, so a
    # broken schema in a section no template uses is out of the checker's reach by design.
    theme.mutate(
        "sections/main-page.liquid",
        lambda t: replace_once(t, "{% schema %}", "{% schema %}\n{ this is not json"),
    )
    return "section schema is not valid JSON"


def missing_asset(theme: Theme) -> str:
    theme.mutate(
        "sections/page.liquid",
        lambda t: replace_once(t, PAGE_ANCHOR, "{{ 'asset-that-does-not-exist.css' | asset_url | stylesheet_tag }}\n  " + PAGE_ANCHOR),
    )
    return "asset 'asset-that-does-not-exist.css' is referenced"


def missing_snippet(theme: Theme) -> str:
    theme.mutate(
        "sections/page.liquid",
        lambda t: replace_once(t, PAGE_ANCHOR, "{% render 'snippet-that-does-not-exist' %}\n  " + PAGE_ANCHOR),
    )
    return "snippet 'snippet-that-does-not-exist' is rendered"


def missing_section_reference(theme: Theme) -> str:
    theme.mutate(
        "sections/page.liquid",
        lambda t: replace_once(t, PAGE_ANCHOR, "{% section 'section-that-is-not-there' %}\n  " + PAGE_ANCHOR),
    )
    return "section 'section-that-is-not-there' is referenced"


def undefined_global_setting(theme: Theme) -> str:
    theme.mutate(
        "sections/page.liquid",
        lambda t: replace_once(t, PAGE_ANCHOR, "<p>{{ settings.setting_never_defined_xyz }}</p>\n  " + PAGE_ANCHOR),
    )
    return "references settings.setting_never_defined_xyz"


CASES = [
    ("unknown section setting in a template", unknown_setting),
    ("unknown block type in a section group", unknown_block_type),
    ("select value outside its declared options", out_of_enum_select),
    ("template points at a missing section file", missing_section_file),
    ("section declared but missing from 'order'", missing_from_order),
    ("'order' references an undeclared section", undeclared_in_order),
    ("template JSON is not valid JSON", invalid_json),
    ("section {% schema %} is not valid JSON", broken_section_schema),
    ("asset referenced but absent", missing_asset),
    ("snippet rendered but absent", missing_snippet),
    ("section referenced but absent", missing_section_reference),
    ("settings.<id> used but not in settings_schema.json", undefined_global_setting),
]


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="vennix-validate-") as tmp:
        theme = Theme(Path(tmp) / "theme")

        print("Clean theme (the fixture every fault is injected into)")
        code, out = theme.run()
        check("unmodified theme passes", code == 0, (out.strip().splitlines() or [""])[-1])

        print("\nEach fault must be caught")
        for label, inject in CASES:
            try:
                expected = inject(theme)
                code, out = theme.run()
                check(label, code == 1 and expected in out, f"exit={code}, looked for {expected!r}")
            except AssertionError as exc:
                check(label, False, f"fixture injection failed: {exc}")
            theme.restore()

        print("\nA clean theme must pass again after every restore")
        code, out = theme.run()
        check("restored theme passes", code == 0, (out.strip().splitlines() or [""])[-1])

        # Regression guard for the 2026-09-12 fix: the CI workflow runs `npm install` in
        # the step before this script, and those packages ship JSONC fixtures that are not
        # valid strict JSON. Scanning them produced 7 phantom failures on a clean theme.
        print("\nnode_modules must be ignored (regression guard)")
        noise = theme.path("node_modules", "@shopify", "theme-graph", "tsconfig.json")
        noise.parent.mkdir(parents=True, exist_ok=True)
        noise.write_text('{\n  // a comment, so not strict JSON\n  "compilerOptions": {},\n}\n', encoding="utf-8")
        theme.path("node_modules", "broken.json").write_text("{ nope }\n", encoding="utf-8")
        code, out = theme.run()
        check("node_modules JSONC does not fail the gate", code == 0, (out.strip().splitlines() or [""])[-1])
        check("node_modules is absent from the report", "node_modules" not in out, out[:200])

    print(f"\n{checks - len(failures)}/{checks} passed")
    if failures:
        print("FAILED:")
        for name in failures:
            print(f"  - {name}")
        return 1
    print("OK — validate_theme.py catches every fault class and ignores non-theme files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
