import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from severity_engine import SeverityEngine

def test_severity_calculation():
    engine = SeverityEngine()
    
    result = engine.calculate_severity('Aphids', 0.95)
    assert result['level'] == 'Critical'
    assert result['score'] == 4
    
    result = engine.calculate_severity('Aphids', 0.75)
    assert result['level'] == 'Moderate'
    
    result = engine.calculate_severity('Healthy', 0.99)
    assert result['level'] == 'None'

def test_severity_thresholds():
    engine = SeverityEngine()
    assert 'Aphids' in engine.thresholds
    assert 'mild' in engine.thresholds['Aphids']
