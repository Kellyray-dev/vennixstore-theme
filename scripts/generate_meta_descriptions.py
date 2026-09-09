"""Generate reviewable SEO description suggestions from a Shopify audit.

This script is intentionally local and dry-run only. It never calls Shopify
and never writes product data. Use --approve only after human review to copy
approved suggestions into deployment_ready.csv.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AUDIT = ROOT / "reports" / "audits" / "post_cleanup_seo_state.csv"
DEFAULT_TEMPLATES = ROOT / "scripts" / "shopify" / "seo_templates.json"
DEFAULT_SUGGESTIONS = ROOT / "reports" / "audits" / "suggested_descriptions.csv"
DEFAULT_DEPLOYMENT = ROOT / "reports" / "audits" / "deployment_ready.csv"
OUTPUT_FIELDS = [
    "productId",
    "title",
    "productType",
    "handle",
    "currentMetaDescription",
    "suggestedDescription",
    "status",
    "reviewNote",
]
GENERIC_WORDS = re.compile(r"\b(product|shop|apparel)\b", re.IGNORECASE)


def needs_description(description: str) -> bool:
    return len(description.strip()) < 50 or bool(GENERIC_WORDS.search(description))


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" ,.-")


def infer_product_type(title: str, product_type: str) -> str:
    """Use the title when Shopify exported no useful ProductType."""
    normalized = compact(product_type)
    if normalized and normalized != "0":
        return normalized
    title_lower = title.casefold()
    title_types = (
        ("balaclava", "Face Covers & Balaclavas"),
        ("sweater", "Men's Sweaters"),
        ("sweatshirt", "Men's Sweaters"),
        ("hoodie", "Men's Jackets"),
        ("windbreaker", "Men's Jackets"),
        ("jacket", "Men's Jackets"),
        ("dress", "Women's Dresses"),
        ("bra", "Women's Bras"),
        ("polo", "Men's Polo Shirts"),
        ("t-shirt", "Men's T-Shirts"),
        ("tee", "Men's T-Shirts"),
        ("shirt", "Men's Shirts"),
        ("tank", "Men's Tank Tops"),
        ("jeans", "Men's Jeans"),
        ("jogger", "Men's Joggers"),
        ("pants", "Men's Pants"),
        ("shorts", "Men's Shorts"),
        ("suit", "Men's Suits"),
        ("hat", "Hats & Headwear"),
        ("glove", "Fitness Accessories"),
        ("necklace", "Fashion Accessories"),
    )
    for keyword, inferred_type in title_types:
        if keyword in title_lower:
            return inferred_type
    return "fashion style"


def value_for(variable: str, title: str, product_type: str) -> str:
    """Resolve only facts available in the audit row and conservative phrases."""
    if variable == "title":
        return title
    if variable == "productType":
        return product_type or "everyday style"
    if variable == "visibleStyleOrPattern":
        return "distinctive styling"
    if variable == "visiblePatternOrStyle":
        return "distinctive styling"
    if variable in {"visibleDetail", "visibleTextureOrDetail", "visibleTextureOrGraphic"}:
        return "a versatile design"
    if variable in {"visibleFit", "visibleFitOrCut", "visibleSilhouette"}:
        return "easy-to-style"
    if variable in {"visibleConstruction", "visibleCut", "visibleSleeveOrCollar", "visibleNeckline"}:
        return "a practical"
    if variable in {"visibleFeature", "supportedFeature", "supportedFunction"}:
        return "everyday functionality"
    if variable in {"supportedUse", "supportedOccasion"}:
        return "everyday wear"
    if variable == "visibleWaistDetail":
        return "an elastic waist"
    if variable in {"visibleLengthOrCut", "visibleTopStyle", "visibleBottomStyle"}:
        return "coordinated styling"
    if variable == "includedPieces":
        return "coordinated pieces"
    if variable in {"visibleCaseStyle", "visibleFormFactor", "visibleLightingStyle", "visibleDesign"}:
        return "a practical design"
    if variable in {"visibleFabricOrDetail", "visibleTextureOrKnit"}:
        return "a distinctive texture"
    if variable == "visiblePortsOrFeature":
        return "multiple connection options"
    return "everyday styling"


def render_template(template: str, variables: list[str], title: str, product_type: str) -> str:
    values = {
        variable: value_for(variable, title, product_type)
        for variable in variables
    }
    values["title"] = title
    return compact(template.format(**values))


def fallback_description(title: str, product_type: str, variation: int = 0) -> str:
    type_name = infer_product_type(title, product_type).lower()
    safe_title = compact(title)
    if len(safe_title) > 80:
        safe_title = safe_title[:77].rsplit(" ", 1)[0] + "..."
    variations = (
        f"{safe_title} brings {type_name} styling to everyday wardrobes, "
        "with a versatile design for casual and seasonal outfits.",
        f"Refresh casual and seasonal outfits with {safe_title}, "
        f"a versatile {type_name} designed for easy everyday styling.",
        f"{safe_title} offers a practical {type_name} option, "
        "easy to pair with casual looks across the seasons.",
    )
    return compact(variations[variation % len(variations)])


def fit_length(
    description: str, title: str, product_type: str, variation: int = 0
) -> str:
    description = compact(description)
    if len(description) < 50:
        description = fallback_description(title, product_type, variation)
    if len(description) > 160:
        sentences = re.findall(r"[^.!?]+[.!?]", description)
        complete = ""
        for sentence in sentences:
            candidate = compact(f"{complete} {sentence}")
            if len(candidate) <= 160:
                complete = candidate
            else:
                break
        description = complete or fallback_description(title, product_type, variation)
    if len(description) >= 160 and not description.endswith((".", "!", "?")):
        description = compact(description[:159].rsplit(" ", 1)[0])
    if len(description) > 160:
        description = compact(description[:159].rsplit(" ", 1)[0])
    return description.rstrip(".") + "."


def validate_rows(rows: list[dict]) -> list[str]:
    warnings: list[str] = []
    invalid = [
        row
        for row in rows
        if not 50 <= len(row["suggestedDescription"]) <= 160
        or not row["suggestedDescription"].endswith(".")
        or "is a 0" in row["suggestedDescription"].casefold()
    ]
    if invalid:
        raise ValueError(f"Invalid generated descriptions: {len(invalid)}")
    repeated = Counter(row["suggestedDescription"] for row in rows)
    for description, count in repeated.items():
        if count >= 3:
            warnings.append(f"{count} repeats: {description}")
    return warnings


def load_templates(path: Path) -> dict[str, dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {item["productType"].casefold(): item for item in data["templates"]}


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input-audit",
        "--audit",
        dest="input_audit",
        type=Path,
        default=DEFAULT_AUDIT,
        help=f"Audit CSV to read (default: {DEFAULT_AUDIT})",
    )
    parser.add_argument("--templates", type=Path, default=DEFAULT_TEMPLATES)
    parser.add_argument(
        "--filter-generic",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Suggest only for short or generic descriptions (default: yes).",
    )
    parser.add_argument(
        "--output-suggestions",
        type=Path,
        default=DEFAULT_SUGGESTIONS,
        help=f"Suggestions CSV path (default: {DEFAULT_SUGGESTIONS})",
    )
    parser.add_argument(
        "--output-deployment",
        type=Path,
        default=DEFAULT_DEPLOYMENT,
        help=f"Deployment CSV path (default: {DEFAULT_DEPLOYMENT})",
    )
    parser.add_argument(
        "--approve",
        action="store_true",
        help="Also create deployment_ready.csv from the generated suggestions.",
    )
    args = parser.parse_args()

    templates = load_templates(args.templates)
    suggestions: list[dict] = []
    with args.input_audit.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            current = row.get("currentMetaDescription") or ""
            is_generic = bool(GENERIC_WORDS.search(current))
            if args.filter_generic and not is_generic:
                continue
            if not args.filter_generic and not needs_description(current):
                continue
            title = compact(row.get("title") or "")
            product_type = compact(row.get("productType") or "")
            resolved_type = infer_product_type(title, product_type)
            template = templates.get(resolved_type.casefold())
            if template:
                description = render_template(
                    template["template"],
                    template.get("variables", []),
                    title,
                    resolved_type,
                )
            else:
                description = fallback_description(
                    title, resolved_type, len(suggestions)
                )
            description = fit_length(
                description, title, resolved_type, len(suggestions)
            )
            suggestions.append(
                {
                    "productId": row.get("productId", ""),
                    "title": title,
                    "productType": product_type,
                    "handle": row.get("handle", ""),
                    "currentMetaDescription": current,
                    "suggestedDescription": description,
                    "status": "suggested",
                    "reviewNote": (
                        "Dry-run suggestion; verify product claims and approve before deployment."
                    ),
                }
            )

    warnings = validate_rows(suggestions)
    suggested_path = args.output_suggestions
    deployment_path = args.output_deployment
    write_csv(suggested_path, suggestions)
    if args.approve:
        write_csv(deployment_path, suggestions)
    print(
        json.dumps(
            {
                "suggestions": len(suggestions),
                "deploymentReady": len(suggestions) if args.approve else 0,
                "dryRun": not args.approve,
                "suggestedFile": str(suggested_path),
                "deploymentFile": str(deployment_path) if args.approve else None,
                "validation": {
                    "allEndWithPeriod": True,
                    "noIsAZero": True,
                    "repeatedDescriptions": warnings,
                },
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
