"""
Translation endpoint — proxies to Google Translate via deep_translator.
Keeps API key off the client and caches aggressively so Google's
free-tier rate limit is never an issue after the first request.
"""

import re
import logging
from typing import Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/translate", tags=["Translation"])
logger = logging.getLogger(__name__)

# In-memory cache: { lang_code: { "english text": "translated text" } }
_cache: Dict[str, Dict[str, str]] = {}

# Supported language codes that match LANGUAGES in SettingsContext
SUPPORTED = {"en", "hi", "te", "ta", "kn", "mr", "gu", "pa"}


class BatchRequest(BaseModel):
    texts: List[str]
    target_lang: str


def _protect(text: str):
    """Replace {{variable}} placeholders so Google Translate won't mangle them."""
    placeholders: Dict[str, str] = {}

    def _sub(m):
        ph = f"XVARX{len(placeholders)}XVARX"
        placeholders[ph] = m.group(0)
        return ph

    protected = re.sub(r"\{\{[^}]+\}\}", _sub, text)
    return protected, placeholders


def _restore(text: str, placeholders: Dict[str, str]) -> str:
    for ph, original in placeholders.items():
        text = text.replace(ph, original)
    return text


@router.post("/batch")
async def translate_batch(req: BatchRequest):
    """
    Translate a list of English strings to the requested language.
    Returns { "english string": "translated string", ... }
    Cached indefinitely in memory for the server lifetime.
    """
    if req.target_lang not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {req.target_lang}")

    # English → return as-is
    if req.target_lang == "en":
        return {t: t for t in req.texts}

    lang_cache = _cache.setdefault(req.target_lang, {})

    result: Dict[str, str] = {}
    to_translate: List[str] = []

    for text in req.texts:
        if text in lang_cache:
            result[text] = lang_cache[text]
        else:
            to_translate.append(text)

    if to_translate:
        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source="en", target=req.target_lang)

            # Protect {{var}} placeholders, then batch-translate in chunks of 50
            # to stay within Google Translate's ~5000-char-per-request limit.
            CHUNK = 50
            for i in range(0, len(to_translate), CHUNK):
                chunk = to_translate[i : i + CHUNK]
                protected_chunk = []
                ph_maps: List[Dict[str, str]] = []
                for text in chunk:
                    p, phs = _protect(text)
                    protected_chunk.append(p)
                    ph_maps.append(phs)
                try:
                    translated_chunk = translator.translate_batch(protected_chunk)
                except Exception as e:
                    logger.warning(f"Batch translate failed (chunk {i}): {e}")
                    translated_chunk = [None] * len(chunk)

                for orig, trans_raw, phs in zip(chunk, translated_chunk, ph_maps):
                    translated = _restore(trans_raw or orig, phs)
                    lang_cache[orig] = translated
                    result[orig] = translated

        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="deep_translator not installed. Run: pip install deep_translator"
            )
        except Exception as e:
            logger.error(f"Translation service error: {e}")
            for text in to_translate:
                if text not in result:
                    result[text] = text

    return result
