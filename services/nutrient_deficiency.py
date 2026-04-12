"""
Nutrient Deficiency Detector
==============================
Detects nutrient deficiencies in cotton leaf images using HSV colour
analysis and simple spatial heuristics.

Supported deficiencies:
  Nitrogen   – generalised yellowing of the whole leaf
  Potassium  – brown scorching / necrosis at the leaf margins
  Magnesium  – interveinal chlorosis (yellow between green veins)
  Iron       – bright / pale yellow on younger tissue
"""

from __future__ import annotations

import cv2
import numpy as np
import logging
from typing import Any

logger = logging.getLogger(__name__)


class NutrientDeficiencyDetector:
    """
    Detects nutrient deficiencies in cotton leaf images using HSV colour
    analysis and simple spatial heuristics.
    """

    # ── HSV thresholds ──────────────────────────────────────────────────────
    # Hue in OpenCV is 0-179; Saturation / Value 0-255

    # Yellow range (covers both Nitrogen and Iron yellowing)
    _YELLOW_LOWER = np.array([18, 60, 80],  dtype=np.uint8)
    _YELLOW_UPPER = np.array([38, 255, 255], dtype=np.uint8)

    # Bright / pale yellow (Iron – low saturation, high value)
    _BRIGHT_YELLOW_LOWER = np.array([18,  30, 180], dtype=np.uint8)
    _BRIGHT_YELLOW_UPPER = np.array([38, 130, 255], dtype=np.uint8)

    # Brown range (Potassium margin necrosis)
    _BROWN_LOWER = np.array([8,  60,  40],  dtype=np.uint8)
    _BROWN_UPPER = np.array([18, 220, 180], dtype=np.uint8)

    # Green range (healthy tissue – used for Magnesium interveinal pattern)
    _GREEN_LOWER = np.array([35, 40, 40],  dtype=np.uint8)
    _GREEN_UPPER = np.array([85, 255, 255], dtype=np.uint8)

    # ── Detection thresholds (fraction of total leaf pixels) ───────────────
    _NITROGEN_YELLOW_THRESH  = 0.30   # ≥30 % yellow → Nitrogen deficiency
    _IRON_BRIGHT_THRESH      = 0.15   # ≥15 % bright yellow → Iron deficiency
    _POTASSIUM_BROWN_THRESH  = 0.08   # ≥ 8 % brown in margin band → Potassium
    _MAGNESIUM_RATIO_THRESH  = 0.20   # yellow-to-green ratio ≥ 0.20 → Magnesium

    # Width of the margin band for Potassium detection
    _MARGIN_FRACTION = 0.15

    # ── Fertiliser recommendations ─────────────────────────────────────────
    _FERTILISER: dict[str, str] = {
        "Nitrogen":  "Apply urea spray (46-0-0) at 2% solution; repeat in 10 days",
        "Potassium": "Apply muriate of potash (MOP) at 2 kg/acre or foliar KNO₃ spray",
        "Magnesium": "Apply magnesium sulphate (Epsom salt) foliar spray at 0.5%",
        "Iron":      "Apply ferrous sulphate (FeSO₄) chelated iron spray at 0.3%",
    }

    # ── Symptom descriptions ───────────────────────────────────────────────
    _SYMPTOMS: dict[str, list[str]] = {
        "Nitrogen":  ["generalised yellowing of entire leaf", "older leaves affected first"],
        "Potassium": ["brown / scorched leaf margins", "marginal necrosis"],
        "Magnesium": ["interveinal chlorosis", "yellow tissue between green veins"],
        "Iron":      ["bright pale yellow on young leaves", "low-saturation yellow patches"],
    }

    # ──────────────────────────────────────────────────────────────────────
    def detect(self, image: np.ndarray) -> dict[str, Any]:
        """
        Analyse a BGR cotton leaf image for nutrient deficiencies.

        Parameters
        ----------
        image : np.ndarray
            BGR image (as returned by cv2.imread or converted from PIL).

        Returns
        -------
        dict with keys:
            deficiency, confidence, symptoms_detected,
            fertilizer_recommendation, reason
        """
        if image is None or image.size == 0:
            return self._no_deficiency("Empty or invalid image supplied")

        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        except cv2.error as exc:
            logger.warning(f"NutrientDetector cvtColor failed: {exc}")
            return self._no_deficiency("Image colour conversion failed")

        total_pixels = hsv.shape[0] * hsv.shape[1]

        # ── colour masks ───────────────────────────────────────────────────
        yellow_mask        = cv2.inRange(hsv, self._YELLOW_LOWER,        self._YELLOW_UPPER)
        bright_yellow_mask = cv2.inRange(hsv, self._BRIGHT_YELLOW_LOWER, self._BRIGHT_YELLOW_UPPER)
        brown_mask         = cv2.inRange(hsv, self._BROWN_LOWER,         self._BROWN_UPPER)
        green_mask         = cv2.inRange(hsv, self._GREEN_LOWER,         self._GREEN_UPPER)

        yellow_frac        = cv2.countNonZero(yellow_mask)        / total_pixels
        bright_yellow_frac = cv2.countNonZero(bright_yellow_mask) / total_pixels
        green_count        = cv2.countNonZero(green_mask)

        # ── margin-restricted brown check (Potassium) ──────────────────────
        margin_brown_frac = self._margin_brown_fraction(brown_mask, image.shape)

        # ── interveinal ratio check (Magnesium) ────────────────────────────
        yellow_count = cv2.countNonZero(yellow_mask)
        mg_ratio = (yellow_count / green_count) if green_count > 0 else 0.0

        # ── priority-ordered decision logic ───────────────────────────────
        # Iron is a sub-class of yellowing; check before generic Nitrogen

        if bright_yellow_frac >= self._IRON_BRIGHT_THRESH:
            conf = min(0.95, 0.55 + bright_yellow_frac * 2.0)
            return self._result("Iron", conf,
                                f"{bright_yellow_frac*100:.1f}% bright-yellow pixels detected")

        if margin_brown_frac >= self._POTASSIUM_BROWN_THRESH:
            conf = min(0.95, 0.55 + margin_brown_frac * 4.0)
            return self._result("Potassium", conf,
                                f"{margin_brown_frac*100:.1f}% brown pixels in leaf margins")

        if yellow_frac >= self._NITROGEN_YELLOW_THRESH:
            conf = min(0.95, 0.50 + yellow_frac * 1.5)
            return self._result("Nitrogen", conf,
                                f"{yellow_frac*100:.1f}% yellow pixels across leaf")

        if mg_ratio >= self._MAGNESIUM_RATIO_THRESH and yellow_frac > 0.05:
            conf = min(0.90, 0.50 + mg_ratio * 0.8)
            return self._result("Magnesium", conf,
                                f"Yellow-to-green pixel ratio of {mg_ratio:.2f} suggests interveinal pattern")

        return self._no_deficiency("Colour distribution within normal range")

    # ── helpers ────────────────────────────────────────────────────────────

    def _margin_brown_fraction(self, brown_mask: np.ndarray,
                               shape: tuple) -> float:
        """Return the fraction of brown pixels within the outer margin band."""
        h, w = shape[:2]
        m = max(1, int(min(h, w) * self._MARGIN_FRACTION))

        margin_mask = np.zeros((h, w), dtype=np.uint8)
        margin_mask[:m,  :] = 255
        margin_mask[-m:, :] = 255
        margin_mask[:,  :m] = 255
        margin_mask[:, -m:] = 255

        margin_brown    = cv2.bitwise_and(brown_mask, brown_mask, mask=margin_mask)
        total_margin    = cv2.countNonZero(margin_mask)
        brown_in_margin = cv2.countNonZero(margin_brown)

        return brown_in_margin / total_margin if total_margin > 0 else 0.0

    def _result(self, deficiency: str, confidence: float,
                extra_reason: str = "") -> dict[str, Any]:
        return {
            "deficiency":                deficiency,
            "confidence":                round(confidence, 3),
            "symptoms_detected":         self._SYMPTOMS[deficiency],
            "fertilizer_recommendation": self._FERTILISER[deficiency],
            "reason":                    extra_reason,
        }

    @staticmethod
    def _no_deficiency(reason: str) -> dict[str, Any]:
        return {
            "deficiency":                "No deficiency detected",
            "confidence":                0.0,
            "symptoms_detected":         [],
            "fertilizer_recommendation": "No fertiliser intervention required",
            "reason":                    reason,
        }
