#!/usr/bin/env python3
"""Create a conservative Shopify product cleanup import and audit report.

The script preserves product handles, SKUs, fulfillment data, image URLs, variant
images, and valid prices. It removes customer-facing supplier-routing options,
clears malformed compare-at prices, normalizes merchandising data, and puts
products requiring merchant review into draft status. The private Cost per item
column is intentionally omitted from the public import deliverable.
"""

from __future__ import annotations

import argparse
import collections
import csv
import html
import json
import re
from pathlib import Path

TITLE_MAP = {
    "cream-textured-tie-front-crop-top-mini-skirt-set": "Cream Textured Tie-Front Top & Mini Skirt Set",
    "go-love-joy-half-finger-fitness-cycling-gloves": "Go Love Joy Half-Finger Training Gloves",
    "original-fluffy-cat-ear-hat-lolita-spiky-star-braided-hair-hat-autumn-winter-warmth-subculture-y2k-headwear": "Fluffy Cat-Ear Braided Y2K Hat",
    "motorcycle-balaclava-full-face-mask-skull-print-motorbike-full-face-mask-windproof-skiing-head-neck-warmer-bicycle-helmet-liner": "Skull-Print Motorcycle Balaclava",
    "fashionable-pink-floral-round-neck-sleeveless-vest-dress-for-women-casual-summer-style": "Floral Sleeveless A-Line Mini Dress",
    "elegant-womens-v-neck-ruffle-blouse-with-tie-waist-lantern-sleeves-long-sleeve-top": "Women's V-Neck Ruffle Tie-Waist Blouse",
    "mens-casual-pants-straight-slim-fit-elastic-waist-jogger-korean-classic-blue-black-gray-male-brand-trousers-plus-size": "Men's Slim-Fit Elastic-Waist Jogger Pants",
    "2024-new-streetwear-loose-jeans-men-korean-style-fashion-loose-straight-wide-leg-pants-mens-brand-clothing-black-light-blue": "Men's Wide-Leg Streetwear Jeans",
    "puaia-print-mens-pants-autumn-winter-new-sport-jogging-trousers-fitness-loose-fit-clothing-solid-color-outfit-streetwear-pants": "Men's Loose-Fit Streetwear Joggers",
    "mens-suits-3pcs-mens-business-suit-notch-lapel-blazer-formal-wedding-groom-pants-tux-vest-tuxedos-blazer-vest-pants": "Men's 3-Piece Slim-Fit Business Suit",
    "men-fast-dry-stretch-pants-ice-silk-trousers-solid-color-mid-waist-loose-breathable-straight-leg-casual-pants-thin-sports-pants": "Men's Quick-Dry Stretch Casual Pants",
    "mens-bone-flower-solid-color-polo-shirt-business-casual-short-sleeve-summer-breathable-versatile-top": "Men's Breathable Short-Sleeve Polo Shirt",
    "mens-regular-fit-multi-pocket-jeans-street-style-cotton-blend-denim-black-gray-non-stretch-all-season-wear-classic-desi": "Men's Multi-Pocket Regular-Fit Jeans",
    "mens-ice-silk-mesh-vest-lightweight-sports-summer-wear-sleeveless-t-shirt-tank-top-casual-fashion-outerwear": "Men's Lightweight Mesh Tank Top",
    "6-pack-mens-breathable-polyester-crew-neck-t-shirts-lightweight-moisture-wicking-short-sleeve-tops-in-multiple-colors-for-casual-wear-and-outdoor-activities": "Men's Moisture-Wicking Crew-Neck T-Shirts — 6 Pack",
    "mens-casual-and-fashionable-long-sleeved-solid-color-shirt-non-ironing-and-wrinkle-resistant-business-top": "Men's Wrinkle-Resistant Business Shirt",
    "mens-linen-wide-leg-casual-pants-are-loose-fitting-breathable-and-comfortable-suitable-for-all-seasons-and-versatile": "Men's Breathable Wide-Leg Casual Pants",
    "men-2025-new-summer-beach-new-models-solid-color-fashion-leisure-comfortable-elastic-waist-double-pockets-cool-sports-shorts": "Men's Elastic-Waist Sports Shorts",
    "2025-new-mens-high-neck-sweater-solid-color-pullover-knitted-warm-casual-turtleneck-sweatwear-woolen-mens-winter-outdoor-2028": "Men's Turtleneck Knit Sweater",
    "2024-spring-and-autumn-new-baseball-collar-short-loose-solid-color-jacket-mens-business-casual-thin-coat-trend": "Men's Baseball-Collar Casual Jacket",
    "mens-new-summer-waffle-round-neck-short-sleeve-t-shirt-comfortable-breathable-short-sleeved-top-for-casual-wear": "Men's Waffle-Knit Crew-Neck T-Shirt",
    "mens-summer-t-shirt-230g-heavy-cotton-vintage-washed-t-shirts-oversized-short-sleeve-loose-streetwear-short-sleeve-tops-tee": "Men's Heavyweight Vintage-Wash T-Shirt",
    "new-size-night-reflective-jackets-double-fabric-windbreaker-hooded-jacket-men-hip-hop-dancer-waterproof-zipper-coats-outwear": "Men's Reflective Hooded Windbreaker",
    "hair-trimmer-beard-shaving-body-clippers-t9-hair-clipper-electric-hair-cutting-machine-professional-barber-men-trimmer-shaver": "T9 Cordless Hair Trimmer & Clipper",
    "gathered-side-collection-lifting-underwear-breasts-brassiere-large-size-bra-full-cup-underwear-brassiere-no-steel-ring-bra": "Women's Wire-Free Full-Cup Support Bra",
    "1-3pcs-breastfeeding-bras-maternity-nursing-bra-for-feeding-nursing-underwear-clothes-for-pregnant-women-wirefree-breathable-bra": "Wire-Free Maternity Nursing Bra",
    "1-5pcs-anti-spy-glass-for-iphone-15-14-13-12-11-16-17-pro-max-mini-x-xs-xr-7-8-6-plus-privacy-screen-protector-for-iphone-17": "iPhone Privacy Screen Protector",
    "magnetic-phone-case-for-iphone-16-17-pro-max-13-11-15-14-12-17-air-17promax-soft-silicone-transparent-shockproof-funda-cover": "MagSafe Silicone iPhone Case",
    "luxury-magnetic-plating-clear-case-for-magsafe-wireless-charging-iphone-11-12-13-14-15-16-17-pro-max-air-plus-shockproof-cover": "Clear MagSafe iPhone Case",
    "180ml-mini-usb-humidifier-aroma-diffuser": "180ml USB Aroma Humidifier",
    "magsafe-iphone-case-luxury-armor-matte": "MagSafe Matte Armor iPhone Case",
    "motion-sensor-strip-light-led-rechargeable": "Rechargeable Motion Sensor LED Strip Light",
    "led-motion-sensor-light-usb-rechargeable": "Rechargeable LED Motion Sensor Night Light",
    "mini-usb-air-humidifier-aroma-diffuser": "Mini USB Aroma Humidifier",
    "hanes-mens-boxer-briefs-cotton-pack": "Hanes Cool Comfort Cotton Boxer Briefs",
    "8-in-1-usb-c-hub-macbook-ipad-iphone": "8-in-1 USB-C Hub for MacBook & iPad",
    "pet-hair-remover-lint-brush-double-sided": "Reusable Double-Sided Pet Hair Brush",
    "memory-foam-cobblestone-bath-mat": "Memory Foam Non-Slip Bath Mat",
    "usb-c-hub-7-8-in-1-multiport-adapter": "7-in-1 USB-C Multiport Hub",
    "watercolor-phone-case": "Purple Watercolor Phone Case",
}

TYPE_MAP = {
    1: "Women's Sets", 2: "Fitness Accessories", 3: "Hats & Headwear",
    4: "Face Covers & Balaclavas", 5: "Women's Dresses", 6: "Women's Tops",
    7: "Men's Pants", 8: "Men's Jeans", 9: "Men's Joggers", 10: "Men's Suits",
    11: "Men's Pants", 12: "Men's Polo Shirts", 13: "Men's Jeans",
    14: "Men's Tank Tops", 15: "Men's T-Shirts", 16: "Men's Shirts",
    17: "Men's Pants", 18: "Men's Shorts", 19: "Men's Sweaters",
    20: "Men's Jackets", 21: "Men's T-Shirts", 22: "Men's T-Shirts",
    23: "Men's Jackets", 24: "Hair Clippers & Trimmers", 25: "Women's Bras",
    26: "Maternity Bras", 27: "Screen Protectors", 28: "Phone Cases",
    29: "Phone Cases", 30: "Humidifiers & Diffusers", 31: "Phone Cases",
    32: "LED Lighting", 33: "LED Lighting", 34: "Humidifiers & Diffusers",
    35: "Men's Underwear", 36: "USB Hubs & Adapters", 37: "Pet Hair Removers",
    38: "Bath Mats & Rugs", 39: "USB Hubs & Adapters", 40: "Phone Cases",
}

SEO_DESCRIPTION_MAP = {
    1: "A cream textured two-piece set with a tie-front crop top and matching mini skirt, designed for warm-weather outfits, vacations, and evenings out.",
    2: "Breathable half-finger training gloves with an anti-slip palm and adjustable wrist support for cycling, weightlifting, and gym sessions.",
    3: "A playful fluffy cat-ear hat with braided ear flaps and star details, designed to add warmth and Y2K-inspired character to cold-weather looks.",
    4: "A black skull-print full-face balaclava designed as a wind-blocking helmet liner, costume accessory, and cold-weather face and neck cover.",
    5: "A lightweight sleeveless floral mini dress with an A-line shape, round neckline, and three color options for casual summer styling.",
    6: "A long-sleeve V-neck blouse with ruffle details, lantern sleeves, and a tie waist, available in six colors and sizes S through 3XL.",
    7: "Men's slim-fit jogger pants with an elastic mid-rise waist, straight-leg shape, lightweight fabric, and sizes M through 5XL.",
    8: "Men's relaxed wide-leg streetwear jeans with an elastic waist, structured cotton-blend fabric, and multiple neutral washes.",
    9: "Men's loose-fit streetwear joggers with a drawstring waist, full-length cut, practical pockets, and lightweight everyday comfort.",
    10: "A men's slim-fit three-piece suit with a notch-lapel blazer, matching vest, and trousers for weddings, business, and formal events.",
    11: "Men's lightweight quick-dry casual pants with a stretch fit, elastic waist, straight leg, and breathable feel for warm-weather wear.",
    12: "A breathable men's short-sleeve polo shirt with a clean solid-color design for casual weekends, travel, and smart everyday outfits.",
    13: "Men's regular-fit street jeans with a durable cotton blend, multiple utility pockets, mid-rise waist, and solid black or gray finish.",
    14: "A lightweight men's sleeveless mesh tank top designed for warm-weather workouts, sports, layering, and relaxed summer outfits.",
    15: "A six-pack of men's crew-neck T-shirts made with lightweight moisture-wicking fabric for workouts, outdoor activity, and daily wear.",
    16: "A men's long-sleeve business shirt with wrinkle-resistant fabric, a turn-down collar, and an easy-care design for work or evenings out.",
    17: "Men's breathable wide-leg casual pants with a drawstring waist, relaxed ankle-length fit, and lightweight fabric for warm-weather comfort.",
    18: "Men's lightweight sports shorts with an elastic waist, breathable fabric, and practical pockets for training, beach days, and casual wear.",
    19: "A men's turtleneck knit pullover with a relaxed fit and full-length sleeves for easy layering through cooler casual and smart-casual days.",
    20: "A lightweight men's baseball-collar jacket with a clean solid-color finish and relaxed shape for transitional weather and everyday layering.",
    21: "A men's waffle-knit crew-neck T-shirt with breathable texture, short sleeves, and a relaxed profile for warm-weather everyday wear.",
    22: "A men's heavyweight vintage-wash T-shirt with a relaxed oversized silhouette and substantial cotton-blend feel for casual streetwear.",
    23: "A men's hooded windbreaker with reflective details, zip closure, practical pockets, and a layered design for visible nighttime wear.",
    24: "A cordless T9 hair trimmer with stainless-steel blades, USB charging, interchangeable guides, and settings for hair, beard, and detail work.",
    25: "A wire-free full-cup bra with breathable fabric, gathered side support, adjustable fit, and extended sizing for comfortable everyday wear.",
    26: "A wire-free maternity and nursing bra with stretch fabric, adjustable straps, and a flexible fit designed for pregnancy and feeding.",
    27: "A tempered-glass iPhone privacy screen protector that limits side-angle viewing while helping protect the display from scratches and impact.",
    28: "A slim silicone iPhone case with MagSafe-compatible magnetic alignment, shock-absorbing TPU, anti-scratch texture, and multiple model options.",
    29: "A clear MagSafe-compatible iPhone case with magnetic alignment, a slim profile, and shock-absorbing protection in multiple colors and models.",
    30: "A compact 180ml USB humidifier with cool mist, quiet operation, touch controls, LED lighting, and automatic shutoff for desks and bedrooms.",
    31: "A matte dual-layer iPhone case with MagSafe compatibility, shock-absorbing PC and TPU construction, and options for iPhone 11 through 17.",
    32: "A rechargeable motion-sensor LED strip light with adjustable modes and brightness for wardrobes, stairs, hallways, cabinets, and kitchens.",
    33: "A rechargeable LED motion-sensor light with wireless magnetic installation and multiple lengths for cabinets, stairs, wardrobes, and kitchens.",
    34: "A compact USB aroma humidifier with cool mist, quiet operation, LED ambiance, and two color choices for a desk, bedroom, or small space.",
    35: "Hanes cotton boxer briefs with moisture-wicking Cool Comfort fabric, a no-ride-up fit, Comfort Flex waistband, and multiple pack options.",
    36: "An 8-in-1 USB-C hub with USB ports, card-reader support, audio connectivity, and compact expansion for compatible MacBook and iPad devices.",
    37: "A reusable double-sided electrostatic brush that lifts pet hair and lint from clothing, sofas, carpets, and furniture without disposable refills.",
    38: "A soft memory-foam bath mat with a cobblestone-textured surface, non-slip base, washable construction, and multiple color options.",
    39: "A compact 7-in-1 USB-C multiport hub that expands compatible laptops and tablets with USB connections for everyday data transfer and accessories.",
    40: "A purple watercolor phone case with marble-style texture, gold-tone accents, a secure fit, and protective options for iPhone and Samsung models.",
}

# Products need merchant review before being returned to active status.
MULTI_SOURCE_DRAFT_HANDLES = {
    "mens-casual-pants-straight-slim-fit-elastic-waist-jogger-korean-classic-blue-black-gray-male-brand-trousers-plus-size",
    "2024-new-streetwear-loose-jeans-men-korean-style-fashion-loose-straight-wide-leg-pants-mens-brand-clothing-black-light-blue",
    "mens-regular-fit-multi-pocket-jeans-street-style-cotton-blend-denim-black-gray-non-stretch-all-season-wear-classic-desi",
}
CONTENT_REVIEW_DRAFT_HANDLES = {
    "mens-ice-silk-mesh-vest-lightweight-sports-summer-wear-sleeveless-t-shirt-tank-top-casual-fashion-outerwear",
}

VERTICAL_BY_INDEX = {
    **{i: "fashion" for i in range(1, 24)},
    24: "lifestyle", 25: "fashion", 26: "fashion",
    27: "tech", 28: "tech", 29: "tech", 30: "home", 31: "tech",
    32: "home", 33: "home", 34: "home", 35: "fashion", 36: "tech",
    37: "home", 38: "home", 39: "tech", 40: "tech",
}

BAD_TAGS_BY_INDEX = {
    1: {"battery candles", "candle set", "flameless candles", "home decor", "led candles"},
    32: {"type c hub"},
    40: {"pusc"},
}

PRODUCT_FIELDS = {
    "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags",
    "Published", "Gift Card", "SEO Title", "SEO Description", "Status",
}


def clean_text(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value or "")).split())


def first_value(rows: list[dict[str, str]], key: str) -> str:
    return next((row.get(key, "").strip() for row in rows if row.get(key, "").strip()), "")


def normalize_model(value: str) -> str:
    value = re.sub(r"^for\s*", "", value.strip(), flags=re.I)
    value = re.sub(r"(?i)iphone\s*", "iPhone ", value)
    value = re.sub(r"(?i)(\d)pro\b", r"\1 Pro", value)
    value = re.sub(r"(?i)\bpro\s*max\b", "Pro Max", value)
    value = re.sub(r"(?i)\bmini\b", "Mini", value)
    value = re.sub(r"(?i)\bplus\b", "Plus", value)
    value = re.sub(r"(?i)\bair\b", "Air", value)
    value = re.sub(r"\s+", " ", value).strip()
    value = value.replace("16 PM", "16 Pro Max")
    return value


def normalize_value(handle: str, name: str, value: str) -> str:
    value = value.strip()
    name_lower = name.casefold()
    if name_lower in {"compatibility", "device model"}:
        return normalize_model(value)
    if name_lower == "pack size":
        match = re.search(r"(\d+)", value)
        return f"{match.group(1)} Pack" if match else value.title()
    if name_lower == "size":
        size_map = {"XXXL": "3XL", "XXXXL": "4XL", "XXXXXL": "5XL", "XS（old）": "XS"}
        value = size_map.get(value, value.upper() if re.fullmatch(r"x+s", value, re.I) else value)
        weight_match = re.fullmatch(r"(\w+)\s+(\d+)-(\d+)KG", value, re.I)
        if weight_match:
            return f"{weight_match.group(1)} ({weight_match.group(2)}–{weight_match.group(3)} kg)"
        return value
    if name_lower in {"color", "finish / kit"}:
        if handle == "mens-new-summer-waffle-round-neck-short-sleeve-t-shirt-comfortable-breathable-short-sleeved-top-for-casual-wear":
            value = re.sub(r"^\d+\s+", "", value)
        if value.islower() or value.isupper():
            return value.title()
        return " ".join(word.capitalize() if word.islower() else word for word in value.split())
    if name_lower == "length" and re.fullmatch(r"\d+cm-\d+LED", value, re.I):
        cm, led = value.split("-")
        return f"{cm[:-2]} cm / {led[:-3]} LED"
    if name_lower == "hub type":
        match = re.search(r"(\d+)\s*IN\s*1", value, re.I)
        return f"{match.group(1)}-in-1" if match else value.title()
    return value


def option_display_name(handle: str, old_name: str, position: int) -> str:
    lower = old_name.casefold()
    if handle.startswith("1-5pcs-anti-spy") and position == 1:
        return "Compatibility"
    if handle.startswith("1-5pcs-anti-spy") and position == 2:
        return "Pack Size"
    if handle.startswith("luxury-magnetic-plating") and position == 2:
        return "Compatibility"
    if handle == "magsafe-iphone-case-luxury-armor-matte" and position == 2:
        return "Compatibility"
    if handle == "watercolor-phone-case" and position == 1:
        return "Compatibility"
    if handle == "motion-sensor-strip-light-led-rechargeable" and old_name == "Emitting Color":
        return "Length"
    if handle == "mens-linen-wide-leg-casual-pants-are-loose-fitting-breathable-and-comfortable-suitable-for-all-seasons-and-versatile" and old_name == "Color":
        return "Style"
    if handle == "hair-trimmer-beard-shaving-body-clippers-t9-hair-clipper-electric-hair-cutting-machine-professional-barber-men-trimmer-shaver" and old_name == "Color":
        return "Finish / Kit"
    if lower == "bands size":
        return "Size"
    return old_name


def should_drop_option(handle: str, name: str, values: list[str]) -> bool:
    if "ships from" in name.casefold():
        return True
    if handle.startswith("1-5pcs-anti-spy") and name.casefold() == "material" and len(values) == 1:
        return True
    return False


def sanitize_body(handle: str, body: str) -> str:
    body = re.sub(r"Welcome to our Store", "", body, flags=re.I)
    body = re.sub(r"<h([3-6])([^>]*)>(.*?)</h\1>", r"<p><strong>\3</strong></p>", body, flags=re.I | re.S)
    body = re.sub(r"\bPrecision-crafted\b", "Designed", body, flags=re.I)
    if handle in CONTENT_REVIEW_DRAFT_HANDLES:
        return (
            "<p>A lightweight sleeveless mesh top designed for warm-weather training, "
            "sports, layering, and relaxed everyday wear.</p>"
            "<ul><li>Sleeveless athletic profile</li><li>Lightweight mesh construction</li>"
            "<li>Designed for warm-weather activity</li></ul>"
            "<p><strong>Review required:</strong> Confirm material, measurements, and care "
            "instructions against the supplier record before activating this product.</p>"
        )
    return body.strip()


def extract_labeled_value(body: str, label: str) -> str:
    text = clean_text(body)
    labels = (
        "Material|Dimensions|Care|Fit|Includes|Compatibility|Compatible|Waist|Color|Size|"
        "Season|Collar|Sleeve|Closure|Pockets|Function|Style|Features|Pack|Cup|Design|Wash|Thickness"
    )
    pattern = rf"\b{re.escape(label)}:\s*(.*?)(?=\s+(?:{labels}):|$)"
    match = re.search(pattern, text, flags=re.I)
    if not match:
        return ""
    value = match.group(1).strip(" .;-")
    value = re.sub(r"(?i)\b(?:premium|high-quality|precision-crafted)\s+", "", value)
    value = value.replace(", Designed body", "")
    if value.casefold().startswith("n/a"):
        return ""
    marketing_terms = ("order ", "add to", "today", "experience ", "don't miss", "versatile solid colors")
    if len(value) > 180 or any(term in value.casefold() for term in marketing_terms):
        return ""
    return value


def clean_tags(raw: str, product_index: int) -> str:
    tags = []
    banned = BAD_TAGS_BY_INDEX.get(product_index, set())
    for tag in raw.split(","):
        normalized = tag.strip().casefold()
        if not normalized or normalized in banned:
            continue
        if normalized not in tags:
            tags.append(normalized)
    vertical = VERTICAL_BY_INDEX[product_index]
    if vertical not in tags:
        tags.append(vertical)
    return ", ".join(sorted(tags))


def group_products(rows: list[dict[str, str]]) -> collections.OrderedDict[str, list[dict[str, str]]]:
    grouped: collections.OrderedDict[str, list[dict[str, str]]] = collections.OrderedDict()
    for row in rows:
        grouped.setdefault(row["Handle"], []).append(row)
    return grouped


def build_clean_catalog(rows: list[dict[str, str]], headers: list[str]):
    products = group_products(rows)
    metafield_fields = [h for h in headers if "(product.metafields." in h]
    product_fields = PRODUCT_FIELDS | set(metafield_fields)
    variant_data_fields = [
        *headers[17:31],  # Variant SKU through Variant Barcode
        "Variant Image", "Variant Weight Unit", "Variant Tax Code",
    ]

    output: list[dict[str, str]] = []
    audit_rows: list[dict[str, object]] = []
    cleared_high = 0
    cleared_non_sale = 0
    removed_source_variants = 0

    for product_index, (handle, source_rows) in enumerate(products.items(), 1):
        product_source = source_rows[0]
        original_title = first_value(source_rows, "Title")
        clean_title = TITLE_MAP[handle]
        variant_rows = [r for r in source_rows if r.get("Variant Price", "").strip()]

        option_names = []
        option_links = []
        option_values = []
        for pos in range(1, 4):
            name = first_value(source_rows, f"Option{pos} Name")
            link = first_value(source_rows, f"Option{pos} Linked To")
            values = list(dict.fromkeys(r.get(f"Option{pos} Value", "").strip() for r in variant_rows if r.get(f"Option{pos} Value", "").strip()))
            option_names.append(name)
            option_links.append(link)
            option_values.append(values)

        keep_positions = [
            pos for pos in range(1, 4)
            if option_names[pos - 1] and not should_drop_option(handle, option_names[pos - 1], option_values[pos - 1])
        ]
        new_option_defs = []
        for pos in keep_positions:
            old_name = option_names[pos - 1]
            new_name = option_display_name(handle, old_name, pos)
            # A taxonomy-linked option must not retain a link when its meaning changes.
            new_link = option_links[pos - 1] if new_name == old_name else ""
            new_option_defs.append((pos, new_name, new_link))

        shipping_positions = [pos for pos in range(1, 4) if "ships from" in option_names[pos - 1].casefold()]
        shipping_sources = set()
        for pos in shipping_positions:
            shipping_sources.update(option_values[pos - 1])

        # Normalize and deduplicate variants after non-customer supplier options are removed.
        candidates: collections.OrderedDict[tuple[str, ...], list[tuple[int, dict[str, str], list[str]]]] = collections.OrderedDict()
        for order, row in enumerate(variant_rows):
            normalized_values = [
                normalize_value(handle, new_name, row.get(f"Option{old_pos} Value", ""))
                for old_pos, new_name, _ in new_option_defs
            ]
            key = tuple(v.casefold() for v in normalized_values)
            candidates.setdefault(key, []).append((order, row, normalized_values))

        selected = []
        for choices in candidates.values():
            def preference(item):
                order, row, _ = item
                source = " ".join(row.get(f"Option{pos} Value", "") for pos in shipping_positions)
                return (0 if "united states" in source.casefold() else 1, order)
            selected.append(min(choices, key=preference))
        selected.sort(key=lambda item: item[0])
        removed_source_variants += len(variant_rows) - len(selected)

        # Preserve all unique product images and assign them back to output rows in order.
        image_records = []
        seen_images = set()
        for row in source_rows:
            src = row.get("Image Src", "").strip()
            if src and src not in seen_images:
                seen_images.add(src)
                image_records.append(src)

        clean_product = {field: first_value(source_rows, field) for field in product_fields}
        clean_product["Title"] = clean_title
        clean_product["Body (HTML)"] = sanitize_body(handle, first_value(source_rows, "Body (HTML)"))
        clean_product["Type"] = TYPE_MAP[product_index]
        clean_product["Tags"] = clean_tags(first_value(source_rows, "Tags"), product_index)
        clean_product["SEO Title"] = f"{clean_title} | Vennix" if len(clean_title) <= 49 else clean_title
        clean_product["SEO Description"] = SEO_DESCRIPTION_MAP[product_index]

        is_review_draft = handle in MULTI_SOURCE_DRAFT_HANDLES or handle in CONTENT_REVIEW_DRAFT_HANDLES
        if is_review_draft:
            clean_product["Status"] = "draft"
            clean_product["Published"] = "false"

        # Enrich existing custom metafields only when their definitions/columns already exist.
        materials_key = " Materials (product.metafields.custom.materials)"
        care_key = "Care Instructions (product.metafields.custom.care_instructions)"
        sizing_key = "Sizing & Fit (product.metafields.custom.sizing_and_fit)"
        if not clean_product.get(materials_key) and handle not in CONTENT_REVIEW_DRAFT_HANDLES:
            clean_product[materials_key] = extract_labeled_value(clean_product["Body (HTML)"], "Material")
        if not clean_product.get(care_key) and handle not in CONTENT_REVIEW_DRAFT_HANDLES:
            clean_product[care_key] = extract_labeled_value(clean_product["Body (HTML)"], "Care")
        if not clean_product.get(sizing_key) and handle not in CONTENT_REVIEW_DRAFT_HANDLES:
            clean_product[sizing_key] = extract_labeled_value(clean_product["Body (HTML)"], "Fit")

        product_output_rows = []
        for variant_index, (_, source_variant, normalized_values) in enumerate(selected):
            new_row = {h: "" for h in headers}
            new_row["Handle"] = handle
            for field in variant_data_fields:
                new_row[field] = source_variant.get(field, "")

            for new_pos, ((_, new_name, new_link), value) in enumerate(zip(new_option_defs, normalized_values), 1):
                if variant_index == 0:
                    new_row[f"Option{new_pos} Name"] = new_name
                    new_row[f"Option{new_pos} Linked To"] = new_link
                new_row[f"Option{new_pos} Value"] = value

            # Keep a valid default variant when no meaningful option survives.
            if not new_option_defs:
                if variant_index == 0:
                    new_row["Option1 Name"] = "Title"
                new_row["Option1 Value"] = "Default Title"

            try:
                price = float(new_row["Variant Price"])
                compare = float(new_row["Variant Compare At Price"]) if new_row["Variant Compare At Price"].strip() else None
            except ValueError:
                compare = None
                price = 0
            if compare is not None and compare <= price:
                new_row["Variant Compare At Price"] = ""
                cleared_non_sale += 1
            elif compare is not None and compare > price * 3:
                new_row["Variant Compare At Price"] = ""
                cleared_high += 1

            product_output_rows.append(new_row)

        total_rows = max(len(product_output_rows), len(image_records), 1)
        while len(product_output_rows) < total_rows:
            product_output_rows.append({h: "" for h in headers})
            product_output_rows[-1]["Handle"] = handle

        for row_index, new_row in enumerate(product_output_rows):
            if row_index == 0:
                for field, value in clean_product.items():
                    new_row[field] = value
            if row_index < len(image_records):
                new_row["Image Src"] = image_records[row_index]
                new_row["Image Position"] = str(row_index + 1)
                new_row["Image Alt Text"] = clean_title if row_index == 0 else f"{clean_title} — alternate view {row_index + 1}"
            output.append(new_row)

        audit_rows.append({
            "handle": handle,
            "title_before": original_title,
            "title_after": clean_title,
            "status_after": clean_product["Status"],
            "variants_before": len(variant_rows),
            "variants_after": len(selected),
            "shipping_sources": len(shipping_sources),
            "review_required": is_review_draft,
        })

    cleaned_products = group_products(output)
    metrics = {
        "products": len(products),
        "rows_before": len(rows),
        "rows_after": len(output),
        "variants_before": sum(len([r for r in rs if r.get("Variant Price", "").strip()]) for rs in products.values()),
        "variants_after": sum(int(r["variants_after"]) for r in audit_rows),
        "removed_duplicate_source_variants": removed_source_variants,
        "cleared_compare_at_above_3x": cleared_high,
        "cleared_compare_at_not_above_price": cleared_non_sale,
        "draft_products_for_review": sum(bool(r["review_required"]) for r in audit_rows),
        "draft_products_total": sum(r["status_after"] == "draft" for r in audit_rows),
        "image_alt_rows": sum(bool(r.get("Image Src") and r.get("Image Alt Text")) for r in output),
        "materials_products": sum(bool(first_value(rs, " Materials (product.metafields.custom.materials)")) for rs in cleaned_products.values()),
        "care_products": sum(bool(first_value(rs, "Care Instructions (product.metafields.custom.care_instructions)")) for rs in cleaned_products.values()),
        "sizing_products": sum(bool(first_value(rs, "Sizing & Fit (product.metafields.custom.sizing_and_fit)")) for rs in cleaned_products.values()),
    }
    return output, audit_rows, metrics


def write_report(path: Path, audit_rows: list[dict[str, object]], metrics: dict[str, int]) -> None:
    lines = [
        "# Vennix catalog cleanup report",
        "",
        "## Summary",
        "",
        f"- Products reviewed: **{metrics['products']}**",
        f"- CSV rows: **{metrics['rows_before']} → {metrics['rows_after']}**",
        f"- Priced variants: **{metrics['variants_before']} → {metrics['variants_after']}**",
        f"- Duplicate supplier-source variants removed: **{metrics['removed_duplicate_source_variants']}**",
        f"- Compare-at prices above 3× selling price cleared: **{metrics['cleared_compare_at_above_3x']}**",
        f"- Compare-at prices at or below selling price cleared: **{metrics['cleared_compare_at_not_above_price']}**",
        f"- Products changed to draft for review: **{metrics['draft_products_for_review']}**",
        f"- Total draft products after cleanup: **{metrics['draft_products_total']}** (including two products that were already draft)",
        f"- Product images with rewritten alt text: **{metrics['image_alt_rows']}**",
        f"- Products with material metafields: **{metrics['materials_products']}**",
        f"- Products with care metafields: **{metrics['care_products']}**",
        f"- Products with sizing/fit metafields: **{metrics['sizing_products']}**",
        "",
        "## Import safety",
        "",
        "The cleaned CSV preserves handles, selected source SKUs, fulfillment service, inventory policy, weights, image URLs, variant images, and valid selling prices. Use Shopify's overwrite option and test a small subset before importing the full file.",
        "",
        "The merchant-private `Cost per item` column is intentionally omitted. Importing this CSV will not expose or update product cost values.",
        "",
        "Products marked **draft** must not be activated until fulfillment source, variant availability, and pricing have been confirmed.",
        "",
        "## Product changes",
        "",
        "| Product | Status | Variants | Supplier sources | Review required |",
        "| --- | --- | ---: | ---: | --- |",
    ]
    for row in audit_rows:
        lines.append(
            f"| {row['title_after']} | {row['status_after']} | {row['variants_before']} → {row['variants_after']} | "
            f"{row['shipping_sources']} | {'Yes' if row['review_required'] else 'No'} |"
        )
    lines += [
        "",
        "## Draft review list",
        "",
        "- **Men's Slim-Fit Elastic-Waist Jogger Pants:** 10 warehouse sources collapsed to US-source size/color variants; two US variants have higher selling prices and require review.",
        "- **Men's Wide-Leg Streetwear Jeans:** 8 warehouse sources collapsed to US-source size/color variants; one US variant has a higher selling price and requires review.",
        "- **Men's Multi-Pocket Regular-Fit Jeans:** 10 warehouse sources collapsed to US-source size variants; verify US fulfillment and product color imagery.",
        "- **Men's Lightweight Mesh Tank Top:** the exported description described a six-pack of T-shirts, so it was replaced with minimal non-speculative copy and set to draft.",
        "",
        "## Before importing",
        "",
        "1. Keep the original export as a private backup.",
        "2. In Shopify, test the four draft products separately before importing the complete CSV.",
        "3. Confirm that overwriting products removes obsolete warehouse-source variants; if not, delete those variants in Shopify Admin first.",
        "4. Verify remaining compare-at prices represent genuine previous selling prices.",
        "5. Confirm shipping profiles, taxes, fulfillment services, inventory policy, and checkout behavior.",
        "6. Do not activate draft products until the review items above are resolved.",
    ]
    path.write_text("\n".join(lines) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()

    with args.input.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        headers = reader.fieldnames
        if not headers:
            raise SystemExit("Input CSV has no header row")
        rows = list(reader)

    missing = set(TITLE_MAP) - {row["Handle"] for row in rows}
    unexpected = {row["Handle"] for row in rows} - set(TITLE_MAP)
    if missing or unexpected:
        raise SystemExit(f"Catalog handles changed. Missing={sorted(missing)} unexpected={sorted(unexpected)}")

    # Product costs are merchant-private and are not required to update storefront data.
    output_headers = [header for header in headers if header != "Cost per item"]
    output, audit_rows, metrics = build_clean_catalog(rows, output_headers)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8-sig", newline="") as destination:
        writer = csv.DictWriter(destination, fieldnames=output_headers, extrasaction="raise", lineterminator="\n")
        writer.writeheader()
        writer.writerows(output)

    args.report.parent.mkdir(parents=True, exist_ok=True)
    write_report(args.report, audit_rows, metrics)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
