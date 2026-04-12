#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Comment
from deep_translator import GoogleTranslator


ROOT = Path(__file__).resolve().parent.parent
CACHE_PATH = ROOT / "scripts" / ".translation-cache-en.json"
DOMAIN = "https://webservice-studios.com"
SKIP_DIRS = {"dist", "assets", ".git", "scripts"}
SKIP_TRANSLATED_SUFFIX = "-en.html"
TEXT_ATTRS = {"alt", "aria-label", "placeholder", "title"}
META_TRANSLATABLE = {
    ("name", "description"),
    ("name", "twitter:title"),
    ("name", "twitter:description"),
    ("property", "og:title"),
    ("property", "og:description"),
}
PROTECTED_TERMS = {
    "Webservice.Studios": "__KEEP_BRAND__",
    "Bielefeld": "__KEEP_BIELEFELD__",
    "Bad Salzuflen": "__KEEP_BADSALZ__",
    "Gütersloh": "__KEEP_GUETERSLOH__",
    "Detmold": "__KEEP_DETMOLD__",
    "Leopoldshöhe": "__KEEP_LEOPOLD__",
    "Oerlinghausen": "__KEEP_OERLING__",
    "Verl": "__KEEP_VERL__",
    "Lage": "__KEEP_LAGE__",
    "Schloß Holte-Stukenbrock": "__KEEP_SHS__",
    "OWL": "__KEEP_OWL__",
    "Google": "__KEEP_GOOGLE__",
    "Meta": "__KEEP_META__",
    "SEO": "__KEEP_SEO__",
    "Local SEO": "__KEEP_LOCALSEO__",
}
UNPROTECT = {value: key for key, value in PROTECTED_TERMS.items()}


def iter_source_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if path.name.endswith(SKIP_TRANSLATED_SUFFIX):
            continue
        files.append(path)
    return sorted(files)


def english_path_for(path: Path) -> Path:
    if path.name == "index.html":
        return path.with_name("index-en.html")
    return path.with_name(f"{path.stem}-en.html")


def load_cache() -> dict[str, str]:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True))


class Translator:
    def __init__(self, cache: dict[str, str]):
        self.cache = cache
        self.service = GoogleTranslator(source="de", target="en")

    def prime(self, texts: list[str]) -> None:
        pending: list[str] = []
        seen: set[str] = set()
        for text in texts:
            stripped = text.strip()
            if not stripped or stripped in self.cache or stripped in seen:
                continue
            pending.append(stripped)
            seen.add(stripped)

        for index in range(0, len(pending), 40):
            chunk = pending[index:index + 40]
            protected_chunk = []
            for item in chunk:
                protected = item
                for original, token in PROTECTED_TERMS.items():
                    protected = protected.replace(original, token)
                protected_chunk.append(protected)

            try:
                translated_chunk = self.service.translate_batch(protected_chunk)
            except Exception:
                translated_chunk = [self.service.translate(item) for item in protected_chunk]

            for original_text, translated in zip(chunk, translated_chunk):
                if translated is None:
                    translated = original_text
                for token, original in UNPROTECT.items():
                    translated = translated.replace(token, original)
                self.cache[original_text] = translated

    def translate(self, text: str) -> str:
        if not text:
            return text
        stripped = text.strip()
        if not stripped:
            return text
        if stripped in self.cache:
            return self._restore_padding(text, self.cache[stripped])

        protected = stripped
        for original, token in PROTECTED_TERMS.items():
            protected = protected.replace(original, token)

        translated = self.service.translate(protected)
        if translated is None:
            translated = stripped

        for token, original in UNPROTECT.items():
            translated = translated.replace(token, original)

        translated = translated.replace("service", "service")
        self.cache[stripped] = translated
        return self._restore_padding(text, translated)

    @staticmethod
    def _restore_padding(original: str, translated: str) -> str:
        leading = re.match(r"^\s*", original).group(0)
        trailing = re.search(r"\s*$", original).group(0)
        return f"{leading}{translated}{trailing}"


def should_translate_text(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return False
    if re.fullmatch(r"[\d\s.,:+\-/%–—()]+", stripped):
        return False
    if stripped in {"‹ ›", "✓", "✔", "+", "−"}:
        return False
    return True


def translate_json(value: Any, translator: Translator) -> Any:
    if isinstance(value, dict):
        out = {}
        for key, inner in value.items():
            if key in {"@id", "url", "image", "email", "sameAs", "logo", "contentUrl"}:
                out[key] = rewrite_absolute_url(inner) if isinstance(inner, str) else inner
            elif key == "inLanguage" and isinstance(inner, str):
                out[key] = "en-US"
            elif key in {"name", "description", "headline", "text"} and isinstance(inner, str) and should_translate_text(inner):
                out[key] = translator.translate(inner)
            else:
                out[key] = translate_json(inner, translator)
        return out
    if isinstance(value, list):
        return [translate_json(item, translator) for item in value]
    if isinstance(value, str):
        if value.startswith("http://") or value.startswith("https://"):
            return rewrite_absolute_url(value)
        return value
    return value


def rewrite_absolute_url(url: str) -> str:
    if not url.startswith(DOMAIN):
        return url
    path = url[len(DOMAIN):]
    if not path:
        return url
    return DOMAIN + english_href_for_path(path)


def source_for_href(current_file: Path, href: str) -> Path | None:
    if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:") or href.startswith("javascript:"):
        return None
    if href.startswith("http://") or href.startswith("https://"):
        if not href.startswith(DOMAIN):
            return None
        relative = href[len(DOMAIN):].lstrip("/")
        candidate = ROOT / relative
    else:
        path_only = href.split("#", 1)[0].split("?", 1)[0]
        candidate = (current_file.parent / path_only).resolve()
        try:
            candidate.relative_to(ROOT)
        except ValueError:
            return None

    if candidate.is_dir():
        index = candidate / "index.html"
        return index if index.exists() else None
    if candidate.exists():
        return candidate
    if str(candidate).endswith("/"):
        index = candidate / "index.html"
        return index if index.exists() else None
    if not candidate.suffix:
        index = candidate / "index.html"
        return index if index.exists() else None
    return None


def english_href_for_path(path: str) -> str:
    if path in {"", "/"}:
        return "/index-en.html"
    clean = path.split("#", 1)[0].split("?", 1)[0]
    anchor = ""
    query = ""
    if "#" in path:
        path, anchor = path.split("#", 1)
        anchor = f"#{anchor}"
    else:
        path = path
    if "?" in clean:
        clean, query_part = clean.split("?", 1)
        query = f"?{query_part}"
    if clean.endswith("/"):
        clean = f"{clean}index.html"
    source = ROOT / clean.lstrip("/")
    if source.exists():
        target = english_path_for(source)
        return "/" + str(target.relative_to(ROOT)).replace(os.sep, "/") + query + anchor
    return path + query + anchor


def rewrite_href(current_file: Path, output_file: Path, href: str) -> str:
    if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:") or href.startswith("javascript:"):
        return href
    anchor = ""
    query = ""
    core = href
    if "#" in core:
        core, anchor_part = core.split("#", 1)
        anchor = f"#{anchor_part}"
    if "?" in core:
        core, query_part = core.split("?", 1)
        query = f"?{query_part}"

    if href.startswith("http://") or href.startswith("https://"):
        return rewrite_absolute_url(href)

    source = source_for_href(current_file, href)
    if source is None:
        return href
    target = english_path_for(source)
    relative = os.path.relpath(target, output_file.parent)
    return relative.replace(os.sep, "/") + query + anchor


def add_hreflang_links(soup: BeautifulSoup, source_file: Path, output_file: Path) -> None:
    head = soup.head
    if not head:
        return
    de_path = "/" + str(source_file.relative_to(ROOT)).replace(os.sep, "/")
    en_path = "/" + str(output_file.relative_to(ROOT)).replace(os.sep, "/")
    if source_file.name == "index.html" and source_file.parent == ROOT:
        de_path = "/"
    for href, lang in ((de_path, "de"), (en_path, "en")):
        tag = soup.new_tag("link")
        tag.attrs["rel"] = "alternate"
        tag.attrs["hreflang"] = lang
        tag.attrs["href"] = f"{DOMAIN}{href}"
        head.append(tag)


def translate_file(source_file: Path, translator: Translator) -> None:
    html = source_file.read_text()
    soup = BeautifulSoup(html, "lxml")
    output_file = english_path_for(source_file)

    if soup.html:
        soup.html["lang"] = "en"

    translation_jobs: list[str] = []

    for text_node in list(soup.find_all(string=True)):
        if isinstance(text_node, Comment):
            continue
        parent = text_node.parent
        if parent is None or parent.name in {"script", "style", "code", "title"}:
            continue
        if should_translate_text(str(text_node)):
            translation_jobs.append(str(text_node))

    if soup.title and soup.title.string:
        translation_jobs.append(soup.title.string)

    for meta in soup.find_all("meta"):
        for attr_name, attr_value in META_TRANSLATABLE:
            if meta.get(attr_name) == attr_value and meta.get("content"):
                translation_jobs.append(meta["content"])

    for tag in soup.find_all(True):
        for attr in TEXT_ATTRS:
            if tag.get(attr) and should_translate_text(tag[attr]):
                translation_jobs.append(tag[attr])

    translator.prime(translation_jobs)

    for text_node in list(soup.find_all(string=True)):
        if isinstance(text_node, Comment):
            continue
        parent = text_node.parent
        if parent is None:
            continue
        if parent.name in {"script", "style"}:
            if parent.name == "script" and parent.get("type") == "application/ld+json":
                try:
                    data = json.loads(text_node)
                except json.JSONDecodeError:
                    continue
                parent.string = json.dumps(translate_json(data, translator), ensure_ascii=False, separators=(",", ":"))
            continue
        if parent.name == "title":
            continue
        if parent.name == "code":
            continue
        if should_translate_text(str(text_node)):
            text_node.replace_with(translator.translate(str(text_node)))

    if soup.title and soup.title.string:
        soup.title.string.replace_with(translator.translate(soup.title.string))

    for meta in soup.find_all("meta"):
        for attr_name, attr_value in META_TRANSLATABLE:
            if meta.get(attr_name) == attr_value and meta.get("content"):
                meta["content"] = translator.translate(meta["content"])

    for tag in soup.find_all(True):
        for attr in TEXT_ATTRS:
            if tag.get(attr):
                value = tag[attr]
                if should_translate_text(value):
                    tag[attr] = translator.translate(value)
        if tag.name == "html":
            tag["lang"] = "en"
        if tag.name == "meta" and tag.get("property") == "og:locale":
            tag["content"] = "en_US"
        if tag.name == "link" and tag.get("rel") == ["canonical"] and tag.get("href"):
            tag["href"] = rewrite_absolute_url(tag["href"])
        if tag.name == "meta" and tag.get("property") == "og:url" and tag.get("content"):
            tag["content"] = rewrite_absolute_url(tag["content"])
        if tag.name == "a" and tag.has_attr("href"):
            tag["href"] = rewrite_href(source_file, output_file, tag["href"])

    add_hreflang_links(soup, source_file, output_file)
    rendered = str(soup)
    rendered = re.sub(r"^html(?=<html)", "<!doctype html>\n", rendered)
    if not rendered.lower().startswith("<!doctype html>"):
        rendered = "<!doctype html>\n" + rendered
    output_file.write_text(rendered)


def mirror_to_dist() -> None:
    for source in iter_source_files():
        translated = english_path_for(source)
        dist_source = ROOT / "dist" / source.relative_to(ROOT)
        dist_target = ROOT / "dist" / translated.relative_to(ROOT)
        dist_target.parent.mkdir(parents=True, exist_ok=True)
        if translated.exists():
            dist_target.write_text(translated.read_text())
        if dist_source.exists() and not dist_target.exists():
            dist_target.write_text(translated.read_text())


def main() -> None:
    cache = load_cache()
    translator = Translator(cache)
    sources = iter_source_files()
    for index, source in enumerate(sources, start=1):
        print(f"[{index}/{len(sources)}] {source.relative_to(ROOT)}")
        translate_file(source, translator)
    save_cache(cache)
    mirror_to_dist()


if __name__ == "__main__":
    main()
