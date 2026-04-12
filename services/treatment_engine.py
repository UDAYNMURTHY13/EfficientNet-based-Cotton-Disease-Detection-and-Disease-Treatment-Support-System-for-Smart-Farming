"""
Treatment Recommendation Engine
================================
Thin orchestration layer that delegates all treatment knowledge to
treatment_db.py.  The severity keys it receives from the pipeline are:
  'Mild' | 'Moderate' | 'Severe' | 'Critical' | 'None' (Healthy)
"""

from __future__ import annotations

import logging
from typing import Any

from services.treatment_db import (
    TREATMENT_DATABASE,
    SEVERITY_DESCRIPTIONS,
    get_treatment_by_severity,
    recommend_treatment,
)

logger = logging.getLogger(__name__)

# Map pipeline severity level -> DB key (they match; alias for clarity)
_SEVERITY_ALIAS: dict[str, str] = {
    'Mild':     'Mild',
    'Moderate': 'Moderate',
    'Severe':   'Severe',
    'Critical': 'Critical',
    'None':     'None',
}

# Severity thresholds used when the pipeline severity engine is unavailable
SEVERITY_THRESHOLDS = {
    'Mild':     (0,   10),
    'Moderate': (10,  30),
    'Severe':   (30,  60),
    'Critical': (60, 100),
}


class TreatmentEngine:
    """Severity-aware treatment recommendation using treatment_db.py as the knowledge base."""

    def recommend(
        self,
        disease: str,
        severity: str,
        affected_area_pct: float,
        lesion_count: int,
        detected_features: list[str],
    ) -> dict[str, Any]:
        """
        Generate a treatment recommendation.

        Parameters
        ----------
        disease           : Predicted disease name from the pipeline
        severity          : 'Mild' | 'Moderate' | 'Severe' | 'Critical'
        affected_area_pct : % leaf area showing symptoms
        lesion_count      : Number of discrete lesions
        detected_features : Visual keywords from XAI / lesion analysis

        Returns
        -------
        dict – treatment plan with urgency, recovery estimate, chemical/organic
               details, cultural measures, and reasoning text
        """
        disease_key = self._normalise_disease(disease)
        sev_key     = _SEVERITY_ALIAS.get(severity, 'Mild')

        record = TREATMENT_DATABASE.get(disease_key)
        if record is None:
            return self._unknown_disease(disease, severity)

        sev_block = get_treatment_by_severity(disease_key, sev_key)
        if sev_block is None:
            # Fallback: Healthy / unknown severity combo
            sev_block = get_treatment_by_severity(disease_key, 'None') or {}

        reason = self._build_reason(
            disease, severity, affected_area_pct, lesion_count, detected_features
        )

        return {
            'disease':                 disease,
            'severity':                sev_key,
            'severity_description':    SEVERITY_DESCRIPTIONS.get(sev_key, ''),
            'affected_area_pct':       affected_area_pct,
            'lesion_count':            lesion_count,
            # Severity-specific blocks from the DB
            'treatment_plan':          sev_block,
            'chemical':                sev_block.get('chemical'),
            'organic':                 sev_block.get('organic'),
            'cultural':                sev_block.get('cultural', []),
            'plan_description':        sev_block.get('description', ''),
            # Urgency / recovery from the top-level disease record
            'urgency':                 record.get('urgency', {}).get(sev_key, 'Treat promptly'),
            'estimated_recovery_days': record.get('recovery_days', {}).get(sev_key, 'Unknown'),
            'preventive_measures':     record.get('preventive', []),
            'reason':                  reason,
            'detected_features_used':  detected_features,
        }

    # ── helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _normalise_disease(name: str) -> str:
        mapping = {
            'aphids':           'Aphids',
            'army worm':        'Army worm',
            'armyworm':         'Army worm',
            'bacterial blight': 'Bacterial Blight',
            'powdery mildew':   'Powdery Mildew',
            'target spot':      'Target spot',
            'healthy':          'Healthy',
        }
        return mapping.get(name.strip().lower(), name)

    @staticmethod
    def _build_reason(
        disease: str, severity: str,
        area_pct: float, lesion_count: int, features: list[str],
    ) -> str:
        parts = [
            f'{severity} {disease} detected',
            f'{area_pct:.1f}% of leaf area affected',
            f'{lesion_count} lesion(s) identified',
        ]
        if features:
            parts.append('Visual features: ' + ', '.join(features))
        return '; '.join(parts)

    @staticmethod
    def _unknown_disease(disease: str, severity: str) -> dict[str, Any]:
        return {
            'disease':                 disease,
            'severity':                severity,
            'severity_description':    '',
            'affected_area_pct':       None,
            'lesion_count':            None,
            'treatment_plan':          None,
            'chemical':                None,
            'organic':                 None,
            'cultural': [
                'Disease not yet in knowledge base',
                'Collect leaf sample and send to plant disease laboratory',
                'Apply broad-spectrum copper-based fungicide as precaution',
                'Consult a certified agronomist',
            ],
            'plan_description':        '',
            'urgency':                 'Seek expert advice promptly',
            'estimated_recovery_days': 'Unknown',
            'preventive_measures':     [],
            'reason': (
                f"'{disease}' is not currently in the treatment database. "
                'Manual expert consultation is recommended.'
            ),
            'detected_features_used': [],
        }

    # ── class-level utility ────────────────────────────────────────────────

    @classmethod
    def classify_severity(cls, affected_area_pct: float, lesion_count: int) -> str:
        """Derive a severity label from raw metrics (fallback if pipeline engine is unavailable)."""
        adjusted = affected_area_pct
        if lesion_count > 50:
            adjusted = min(adjusted + 15, 100)
        elif lesion_count > 20:
            adjusted = min(adjusted + 5, 100)

        for label, (lo, hi) in SEVERITY_THRESHOLDS.items():
            if lo <= adjusted < hi:
                return label
        return 'Critical'
