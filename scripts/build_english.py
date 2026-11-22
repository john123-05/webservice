#!/usr/bin/env python3
"""Baut die englischen Seiten (*-en.html) aus den aktuellen deutschen Seiten.

Design, Aufbau und Skripte kommen 1:1 aus der deutschen Seite. Getauscht wird nur Text:
jeder Textblock (Absatz, Überschrift, Knopf, Listenpunkt ...) wird über die
Übersetzungsliste scripts/english/en.json ersetzt (Deutsch -> Englisch, von Hand übersetzt,
ohne Orts-Bezug zu Bielefeld/OWL). Links auf deutsche Seiten zeigen danach auf die englische
Fassung, falls es eine gibt.

  python3 scripts/build_english.py            # alle englischen Seiten neu bauen
  python3 scripts/build_english.py --missing  # nur fehlende Übersetzungen auflisten
                                              # (schreibt scripts/english/missing.json)

Übersetzung „∅“ entfernt den Block im Englischen ganz (z. B. Links auf Ortsseiten).

Fehlt eine Übersetzung, bricht der Build ab und nennt die Sätze. Neue deutsche Sätze also
in en.json ergänzen und den Build erneut laufen lassen.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "scripts" / "english"
DICT_PATH = DATA / "en.json"
MISSING_PATH = DATA / "missing.json"
DOMAIN = "https://impress-rank.de"

# Deutsche Quellseiten, die eine englische Fassung bekommen (ohne Ortsseiten).
PAGES = [
    "index.html",
    "webdesign.html",
    "seo.html",
    "anzeigen.html",
    "projekte.html",
    "anfrage.html",
    "naechster-schritt.html",
    "fachartikel.html",
    "3-tipps.html",
    "newsletter.html",
    "impressum.html",
    "datenschutz.html",
    "blog/die-mysterie-box/index.html",
    "blog/einfacher-weg-bei-google-hoeher-zu-ranken/index.html",
    "blog/gewinne-gegen-besseres-marketing/index.html",
    "blog/networking-networking-networking/index.html",
    "blog/wie-bauen-unternehmer-in-owl-eine-starke-marke-auf/index.html",
    "blog/wozu-eigentlich-bei-google-ganz-oben/index.html",
]

# Deutsche Seiten ohne englische Fassung: Links darauf zeigen im Englischen hierhin.
FALLBACK = {
    "leistungen.html": "index-en.html",
    "standorte.html": "index-en.html",
    "kontakt.html": "anfrage-en.html",
    "copywriting.html": "webdesign-en.html",
    "ressourcen.html": "fachartikel-en.html",
    "seo-bielefeld.html": "seo-en.html",
    "seo-bad-salzuflen.html": "seo-en.html",
    "local-seo-bielefeld.html": "seo-en.html",
    "website-wird-bei-google-nicht-gefunden.html": "seo-en.html",
    "online-marketing-bielefeld.html": "index-en.html",
    "online-marketing-bad-salzuflen.html": "index-en.html",
}
FALLBACK_PATTERN = [  # alle übrigen Website-/Ortsseiten
    (re.compile(r"^(webdesign-.+|webentwicklung-.+|backend-.+|website-.+)\.html$"), "webdesign-en.html"),
]

BLOCK = {
    "address", "article", "aside", "blockquote", "body", "dd", "details", "dialog", "div", "dl", "dt",
    "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
    "hr", "html", "head", "li", "main", "nav", "ol", "p", "pre", "section", "summary", "table", "tbody",
    "td", "tfoot", "th", "thead", "tr", "ul", "select", "option", "textarea", "iframe", "video", "audio",
    "picture", "source", "canvas", "noscript", "template", "input", "label", "button", "meta", "link",
}
SKIP = {"script", "style", "noscript", "code", "pre", "textarea", "head", "title"}
OPAQUE = {"svg", "img", "picture", "video", "iframe", "input", "select", "textarea", "canvas"}
TEXT_ATTRS = ("alt", "aria-label", "placeholder", "title", "data-label", "data-title", "value")
META_KEYS = {
    ("name", "description"), ("name", "twitter:title"), ("name", "twitter:description"),
    ("property", "og:title"), ("property", "og:description"), ("property", "og:image:alt"),
}
JSONLD_KEYS = {"name", "description", "headline", "text", "alternateName", "serviceType", "areaServed",
               "jobTitle", "slogan", "about", "keywords", "articleSection"}

NEUTRAL = re.compile(r"^[\s\d.,:;+\-–—/%()€$&|·•✓✔→←‹›*#!?\"'„“”]*$")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def needs_text(s: str) -> bool:
    s = norm(s)
    return bool(s) and not NEUTRAL.match(s)


def en_path(rel: str) -> str:
    p = Path(rel)
    return str(p.with_name("index-en.html" if p.name == "index.html" else f"{p.stem}-en.html"))


EN_TARGETS = {rel: en_path(rel) for rel in PAGES}


class Dictionary:
    def __init__(self) -> None:
        self.entries: dict[str, str] = {}
        if DICT_PATH.exists():
            for item in json.loads(DICT_PATH.read_text()):
                self.entries[norm(item["de"])] = item["en"]
        self.missing: dict[str, dict] = {}
        self.used: set[str] = set()

    def get(self, de: str, page: str) -> str | None:
        key = norm(de)
        if key in self.entries:
            self.used.add(key)
            return self.entries[key]
        if not needs_text(key):
            return de
        mid = hashlib.sha1(key.encode()).hexdigest()[:10]
        self.missing.setdefault(key, {"id": mid, "page": page, "de": key})
        return None


# --------------------------------------------------------------------------- Textblöcke

def inline_only(tag: Tag) -> bool:
    for d in tag.descendants:
        if isinstance(d, Tag):
            if d.name in OPAQUE:
                continue
            if any(p.name in OPAQUE for p in d.parents if p is not tag and isinstance(p, Tag)):
                continue
            if d.name in BLOCK:
                return False
    return True


def own_text(tag: Tag) -> bool:
    return any(isinstance(c, NavigableString) and not isinstance(c, Comment) and c.strip() for c in tag.children)


def has_text(tag: Tag) -> bool:
    for d in tag.descendants:
        if isinstance(d, NavigableString) and not isinstance(d, Comment) and d.strip():
            if not any(p.name in OPAQUE or p.name in SKIP for p in d.parents if isinstance(p, Tag)):
                return True
    return False


def units(soup: BeautifulSoup) -> list:
    """Größte Elemente, die nur Inline-Inhalt haben (z. B. <p>, <h2>, <a>), plus lose Textknoten."""
    found: list = []

    def walk(node: Tag) -> None:
        for child in list(node.children):
            if isinstance(child, Comment):
                continue
            if isinstance(child, NavigableString):
                if child.strip() and needs_text(str(child)):
                    found.append(child)
                continue
            if not isinstance(child, Tag) or child.name in SKIP or child.name in OPAQUE:
                continue
            if inline_only(child) and has_text(child):
                tags = [c for c in child.children if isinstance(c, Tag)]
                # Reine Knopf-Gruppen (nur Elemente, kein eigener Text) weiter aufteilen
                if not own_text(child) and len(tags) > 1 and child.name not in {"a", "button", "label", "span", "strong", "em", "b", "i"}:
                    walk(child)
                else:
                    found.append(child)
            else:
                walk(child)

    if soup.body:
        walk(soup.body)
    return found


def fragment_of(tag: Tag) -> tuple[str, list[str]]:
    """Innerer HTML-Code mit Platzhaltern ⟦1⟧ für Grafiken/Bilder."""
    clone = BeautifulSoup(tag.decode_contents(), "html.parser")
    opaque: list[str] = []
    for el in clone.find_all(list(OPAQUE)):
        if any(p.name in OPAQUE for p in el.parents if isinstance(p, Tag)):
            continue
        opaque.append(str(el))
        el.replace_with(NavigableString(f"⟦{len(opaque)}⟧"))
    return norm(str(clone)), opaque


def restore(fragment: str, opaque: list[str]) -> str:
    for i, html in enumerate(opaque, start=1):
        fragment = fragment.replace(f"⟦{i}⟧", html)
    return fragment


# --------------------------------------------------------------------------- Links

def resolve(page: str, href: str) -> str | None:
    """Deutsche Zielseite (relativ zu ROOT) eines internen Links, sonst None."""
    if href.startswith(DOMAIN):
        href = href[len(DOMAIN):] or "/"
    if re.match(r"^[a-z]+:", href) or href.startswith(("#", "//")):
        return None
    path = href.split("#", 1)[0].split("?", 1)[0]
    if path == "":
        return None
    base = Path(page).parent
    target = Path(path.lstrip("/")) if path.startswith("/") else base / path
    target = Path(os.path.normpath(target))
    s = str(target)
    for cand in (s, s + ".html", os.path.join(s, "index.html")):
        if cand in (".", ""):
            cand = "index.html"
        if cand.startswith("./"):
            cand = cand[2:]
        if (ROOT / cand).is_file() and cand.endswith(".html"):
            return os.path.normpath(cand)
    if path.endswith("/") or s == ".":
        cand = os.path.normpath(os.path.join(s, "index.html"))
        if (ROOT / cand).is_file():
            return cand
    return None


def english_target(de_rel: str) -> str | None:
    if de_rel.endswith("-en.html"):
        return de_rel
    if de_rel in EN_TARGETS:
        return EN_TARGETS[de_rel]
    if de_rel in FALLBACK:
        return FALLBACK[de_rel]
    for pattern, target in FALLBACK_PATTERN:
        if pattern.match(de_rel):
            return target
    return None


def web_path(rel: str) -> str:
    """Saubere Adresse wie auf Netlify: index-en -> /index-en, Unterordner mit .html."""
    rel = rel.replace(os.sep, "/")
    if "/" not in rel:
        return "/" + rel[:-5]
    return "/" + rel


def rewrite_href(page: str, href: str) -> str:
    de_rel = resolve(page, href)
    if not de_rel:
        return href
    target = english_target(de_rel)
    if not target:
        return href  # deutsche Seite ohne englische Fassung (z. B. Schausteller): bleibt deutsch
    anchor = "#" + href.split("#", 1)[1] if "#" in href else ""
    if href.startswith(DOMAIN):
        return DOMAIN + web_path(target) + anchor
    return web_path(target) + anchor


# --------------------------------------------------------------------------- Seite bauen

def translate_jsonld(value, d: Dictionary, page: str, key: str | None = None):
    if isinstance(value, dict):
        return {k: translate_jsonld(v, d, page, k) for k, v in value.items()}
    if isinstance(value, list):
        return [translate_jsonld(v, d, page, key) for v in value]
    if isinstance(value, str):
        if value.startswith(DOMAIN):
            de_rel = resolve(page, value)
            target = english_target(de_rel) if de_rel else None
            return DOMAIN + web_path(target) if target else value
        if key == "inLanguage":
            return "en"
        if key in JSONLD_KEYS and needs_text(value):
            out = d.get(value, page)
            return out if out is not None else value
    return value


SCRIPT_REPLACE = [
    ("['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']",
     "['January','February','March','April','May','June','July','August','September','October','November','December']"),
]


def build_page(rel: str, d: Dictionary, write: bool) -> None:
    src = ROOT / rel
    soup = BeautifulSoup(src.read_text(encoding="utf-8"), "html.parser")
    out_rel = EN_TARGETS[rel]

    # Textblöcke
    for unit in units(soup):
        if isinstance(unit, NavigableString):
            en = d.get(str(unit), rel)
            if en == "∅":
                unit.replace_with(NavigableString(""))
            elif en is not None:
                lead = re.match(r"^\s*", str(unit)).group(0)
                trail = re.search(r"\s*$", str(unit)).group(0)
                unit.replace_with(NavigableString(lead + en + trail))
            continue
        frag, opaque = fragment_of(unit)
        en = d.get(frag, rel)
        if en is None:
            continue
        if en == "∅":  # im Englischen weglassen (z. B. Links auf reine Ortsseiten)
            unit.decompose()
            continue
        unit.clear()
        for node in list(BeautifulSoup(restore(en, opaque), "html.parser").contents):
            unit.append(node)

    # Titel, Meta, Attribute
    if soup.title and soup.title.string:
        en = d.get(soup.title.string, rel)
        if en is not None:
            soup.title.string = en
    for meta in soup.find_all("meta"):
        for k, v in META_KEYS:
            if meta.get(k) == v and meta.get("content") and needs_text(meta["content"]):
                en = d.get(meta["content"], rel)
                if en is not None:
                    meta["content"] = en
        if meta.get("property") == "og:locale":
            meta["content"] = "en_US"
        if meta.get("property") == "og:url" and meta.get("content"):
            meta["content"] = DOMAIN + web_path(out_rel) if out_rel != "index-en.html" else DOMAIN + "/index-en"
    for tag in soup.find_all(True):
        if tag.name in {"script", "style"}:
            continue
        for attr in TEXT_ATTRS:
            val = tag.get(attr)
            if isinstance(val, str) and needs_text(val) and not (attr == "value" and tag.name != "button" and tag.get("type") not in {"submit", "button"}):
                en = d.get(val, rel)
                if en is not None:
                    tag[attr] = en
        if tag.name == "a" and tag.get("href"):
            tag["href"] = rewrite_href(rel, tag["href"])
        if tag.name == "form" and tag.get("action"):
            tag["action"] = rewrite_href(rel, tag["action"])

    # Skripte: JSON-LD übersetzen, Monatsnamen u. ä. ersetzen
    for script in soup.find_all("script"):
        text = script.string
        if not text:
            continue
        if script.get("type") == "application/ld+json":
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue
            script.string = "\n" + json.dumps(translate_jsonld(data, d, rel), ensure_ascii=False, indent=2) + "\n    "
        else:
            new = text
            for a, b in SCRIPT_REPLACE:
                new = new.replace(a, b)
            if new != text:
                script.string = new

    # Sprache, Canonical, hreflang
    if soup.html:
        soup.html["lang"] = "en"
    de_url = DOMAIN + ("/" if rel == "index.html" else web_path(rel).replace("/index.html", "/"))
    en_url = DOMAIN + web_path(out_rel)
    canon = soup.find("link", rel="canonical")
    if canon:
        canon["href"] = en_url
    for link in soup.find_all("link", rel="alternate"):
        if link.get("hreflang"):
            link.decompose()
    if soup.head:
        for lang, url in (("de", de_url), ("en", en_url), ("x-default", de_url)):
            tag = soup.new_tag("link", rel="alternate", hreflang=lang, href=url)
            soup.head.append(tag)
            soup.head.append(NavigableString("\n"))

    if write:
        html = str(soup)
        if not html.lower().startswith("<!doctype"):
            html = "<!doctype html>\n" + html
        (ROOT / out_rel).write_text(html, encoding="utf-8")


def add_hreflang_to_german(rel: str) -> None:
    """Deutsche Seite verweist per hreflang auf ihre englische Fassung (ohne den Rest neu zu formatieren)."""
    path = ROOT / rel
    html = path.read_text(encoding="utf-8")
    html = re.sub(r"\n?\s*<link rel=\"alternate\" hreflang=\"[^\"]+\" href=\"[^\"]+\"\s*/?>", "", html)
    de_url = DOMAIN + ("/" if rel == "index.html" else web_path(rel).replace("/index.html", "/"))
    en_url = DOMAIN + web_path(EN_TARGETS[rel])
    links = "".join(
        f'\n    <link rel="alternate" hreflang="{lang}" href="{url}" />'
        for lang, url in (("de", de_url), ("en", en_url), ("x-default", de_url))
    )
    html = html.replace("</head>", links + "\n</head>", 1) if "</head>" in html else html
    path.write_text(html, encoding="utf-8")


def main() -> int:
    only_missing = "--missing" in sys.argv
    d = Dictionary()
    for rel in PAGES:
        if not only_missing:
            add_hreflang_to_german(rel)
        build_page(rel, d, write=not only_missing)
    if d.missing:
        MISSING_PATH.write_text(json.dumps(list(d.missing.values()), ensure_ascii=False, indent=1))
        print(f"{len(d.missing)} Textblöcke ohne Übersetzung -> {MISSING_PATH.relative_to(ROOT)}")
        return 0 if only_missing else 1
    if MISSING_PATH.exists():
        MISSING_PATH.unlink()
    unused = set(d.entries) - d.used
    print(f"{len(PAGES)} englische Seiten gebaut. Ungenutzte Einträge in en.json: {len(unused)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
