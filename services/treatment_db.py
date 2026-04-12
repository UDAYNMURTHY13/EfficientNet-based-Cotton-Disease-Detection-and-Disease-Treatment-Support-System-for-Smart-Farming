TREATMENT_DATABASE = {

    'Aphids': {
        'disease_info': {
            'scientific_name': 'Aphis gossypii',
            'common_name': 'Cotton Aphid',
            'type': 'pest',
            'symptoms': ['Curled leaves', 'Stunted growth', 'Honeydew secretion', 'Sooty mold', 'Yellowing'],
            'spread': 'Wind, ants, contaminated tools',
            'favorable_conditions': 'Cool weather, high nitrogen',
        },
        'severity_based_treatment': {
            'Mild': {
                'description': 'Early infestation, isolated colonies, <10% plant affected',
                'chemical': None,
                'organic': {
                    'primary':     {'name': 'Neem oil 1500ppm',  'dosage': '5ml/L',  'frequency': 'Every 5-7 days'},
                    'alternative': {'name': 'Insecticidal soap', 'dosage': '5ml/L',  'frequency': 'Every 5 days'},
                    'effectiveness': '70-80%',
                },
                'cultural': ['Remove affected leaves manually', 'Yellow sticky traps', 'Introduce ladybugs'],
            },
            'Moderate': {
                'description': 'Moderate infestation, multiple colonies, 10-30% plant affected',
                'chemical': {
                    'primary':     {'name': 'Imidacloprid 17.8% SL', 'dosage': '0.5ml/L', 'cost': 'Rs.400-600/acre'},
                    'application': 'Spray on leaf undersides, repeat after 10 days',
                    'safety':      'Wear PPE, avoid drift, 7-day withdrawal period',
                },
                'organic': {
                    'primary':     {'name': 'Neem oil 1500ppm',  'dosage': '5ml/L',  'frequency': 'Every 5 days'},
                    'alternative': {'name': 'Insecticidal soap', 'dosage': '10ml/L', 'frequency': 'Every 5 days'},
                    'effectiveness': '70-80%',
                },
                'cultural': ['Remove weeds', 'Balanced fertilization', 'Proper plant spacing'],
            },
            'Severe': {
                'description': 'Severe infestation, widespread colonies, 30-60% plant affected',
                'chemical': {
                    'primary':     {'name': 'Thiamethoxam 25% WG',   'dosage': '0.2g/L',  'cost': 'Rs.500-700/acre'},
                    'alternative': {'name': 'Imidacloprid 17.8% SL', 'dosage': '0.5ml/L', 'cost': 'Rs.400-600/acre'},
                    'application': 'Spray all plant surfaces, repeat after 7 days',
                    'safety':      'Full PPE, avoid application near flowering, 7-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Neem oil + Insecticidal soap (tank mix)', 'dosage': '5ml + 10ml/L', 'frequency': 'Every 4 days'},
                    'effectiveness': '65-75%',
                },
                'cultural': ['Destroy heavily infested plant parts', 'Systemic soil drench if needed'],
            },
            'Critical': {
                'description': 'Colony collapse risk, >60% plant affected, sooty mold present',
                'chemical': {
                    'primary':     {'name': 'Imidacloprid + Thiamethoxam (rotation)', 'dosage': '0.5ml/L each alternately', 'cost': 'Rs.900-1300/acre'},
                    'alternative': {'name': 'Flonicamid 50% WG', 'dosage': '0.3g/L', 'cost': 'Rs.700-1000/acre'},
                    'application': 'Alternate sprays every 7 days, include systemic soil drench',
                    'safety':      'Strict PPE, avoid pollinators, 7-day withdrawal, do not apply in rain',
                },
                'organic': {
                    'primary':       {'name': 'Pyrethrin + Neem oil combo', 'dosage': 'As per label', 'frequency': 'Every 3 days'},
                    'note':          'Limited effectiveness at this stage; chemical intervention strongly recommended',
                    'effectiveness': '40-55%',
                },
                'cultural': ['Consider removing and destroying entire heavily infested plants', 'Contact agricultural extension officer'],
            },
        },
        'urgency': {
            'Mild':     'Monitor; treat within 5-7 days if population rises',
            'Moderate': 'Apply treatment within 2 days',
            'Severe':   'Treat immediately; re-inspect in 48 hours',
            'Critical': 'Call extension officer; treat within 24 hours',
        },
        'recovery_days': {
            'Mild': '5-7 days', 'Moderate': '7-10 days',
            'Severe': '14-21 days', 'Critical': '21-30 days',
        },
        'preventive': ['Remove weeds', 'Yellow sticky traps', 'Encourage ladybugs', 'Balanced fertilization', 'Proper spacing'],
    },

    'Army worm': {
        'disease_info': {
            'scientific_name': 'Spodoptera litura',
            'common_name': 'Cotton Leafworm',
            'type': 'pest',
            'symptoms': ['Irregular holes', 'Defoliation', 'Frass on leaves', 'Skeletonized leaves'],
            'spread': 'Adult moths, wind',
            'favorable_conditions': 'Warm humid weather',
        },
        'severity_based_treatment': {
            'Mild': {
                'description': 'Egg masses or early instar larvae, <10% foliage damage',
                'chemical': None,
                'organic': {
                    'primary':       {'name': 'Bacillus thuringiensis (Bt)', 'dosage': '1g/L', 'frequency': 'Every 7 days'},
                    'note':          'Most effective on young larvae (1st-2nd instar)',
                    'effectiveness': '80-85%',
                },
                'cultural': ['Hand-pick egg masses', 'Install pheromone traps', 'Morning field scouting'],
            },
            'Moderate': {
                'description': 'Active larvae visible, 10-30% foliage damage',
                'chemical': {
                    'primary':     {'name': 'Chlorantraniliprole 18.5% SC', 'dosage': '0.3ml/L', 'cost': 'Rs.500-700/acre'},
                    'application': 'Early morning or evening spray targeting larvae directly',
                    'safety':      'PPE required, 14-day withdrawal period',
                },
                'organic': {
                    'primary':       {'name': 'Bacillus thuringiensis + Neem extract (tank mix)', 'dosage': '1g + 5ml/L', 'frequency': 'Every 7 days'},
                    'effectiveness': '75-80%',
                },
                'cultural': ['Deep plowing to expose pupae', 'Crop rotation', 'Remove plant debris'],
            },
            'Severe': {
                'description': 'Heavy larval population, 30-60% foliage damage, frass visible',
                'chemical': {
                    'primary':     {'name': 'Emamectin benzoate 5% SG', 'dosage': '0.4g/L', 'cost': 'Rs.600-800/acre'},
                    'alternative': {'name': 'Spinosad 45% SC',           'dosage': '0.3ml/L', 'cost': 'Rs.700-900/acre'},
                    'application': '2 sprays 10 days apart, cover entire canopy',
                    'safety':      'Full PPE, no drift near water bodies, 14-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Spinosad (OMRI listed)', 'dosage': '0.5ml/L', 'frequency': 'Every 10 days'},
                    'effectiveness': '70-75%',
                },
                'cultural': ['Boundary pheromone trapping', 'Harvest early if crop is mature', 'Alert neighboring farms'],
            },
            'Critical': {
                'description': 'Mass migration, >60% defoliation, crop loss imminent',
                'chemical': {
                    'primary':     {'name': 'Chlorantraniliprole + Emamectin benzoate (rotation)', 'dosage': 'Full label rates alternately', 'cost': 'Rs.1100-1500/acre'},
                    'alternative': {'name': 'Indoxacarb 14.5% SC', 'dosage': '0.75ml/L', 'cost': 'Rs.800-1100/acre'},
                    'application': 'Immediate spray, follow-up in 5 days, cover entire field',
                    'safety':      'Strict PPE, 14-day withdrawal, notify local authorities if migratory outbreak',
                },
                'organic': {
                    'primary':       {'name': 'Not adequate as standalone treatment at this stage'},
                    'note':          'Chemical intervention is mandatory; use organics as supplements only',
                    'effectiveness': '30-45%',
                },
                'cultural': ['Contact pest control authority immediately', 'Consider crop sacrifice in extreme zones'],
            },
        },
        'urgency': {
            'Mild':     'Apply Bt within 3 days of first sighting',
            'Moderate': 'Chemical spray within 48 hours',
            'Severe':   'Treat immediately; check adjacent fields',
            'Critical': 'Emergency intervention; consult agronomist today',
        },
        'recovery_days': {
            'Mild': '7-10 days', 'Moderate': '10-14 days',
            'Severe': '14-21 days', 'Critical': '21-35 days',
        },
        'preventive': ['Pheromone traps', 'Hand-picking', 'Deep plowing', 'Crop rotation', 'Regular monitoring'],
    },

    'Bacterial Blight': {
        'disease_info': {
            'scientific_name': 'Xanthomonas citri pv. malvacearum',
            'common_name': 'Angular Leaf Spot',
            'type': 'bacterial',
            'symptoms': ['Water-soaked lesions', 'Angular spots', 'Boll rot', 'Stem cankers'],
            'spread': 'Rain splash, contaminated seeds, tools',
            'favorable_conditions': 'High humidity, warm temperature',
        },
        'severity_based_treatment': {
            'Mild': {
                'description': 'Few angular spots, <5% leaf area affected, no boll infection',
                'chemical': None,
                'organic': {
                    'primary':       {'name': 'Bordeaux mixture 1%', 'dosage': 'As per label', 'frequency': 'Every 10-15 days'},
                    'note':          'More preventive than curative; apply before rain',
                    'effectiveness': '60-65%',
                },
                'cultural': ['Remove and destroy infected leaves', 'Avoid overhead irrigation', 'Disinfect pruning tools with bleach'],
            },
            'Moderate': {
                'description': 'Spreading lesions, 5-20% leaf area, early boll symptoms',
                'chemical': {
                    'primary':     {'name': 'Streptocycline 300ppm + Copper oxychloride 0.25%', 'dosage': 'As specified', 'cost': 'Rs.350-500/acre'},
                    'alternative': {'name': 'Kasugamycin 3% SL', 'dosage': '2ml/L', 'cost': 'Rs.400-600/acre'},
                    'application': '2-3 sprays at 10-day intervals',
                    'safety':      'Avoid application during flowering, 10-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Copper hydroxide', 'dosage': '2g/L', 'frequency': 'Every 10 days'},
                    'effectiveness': '60-70%',
                },
                'cultural': ['Maintain proper plant spacing', 'Practice crop rotation', 'Use resistant varieties'],
            },
            'Severe': {
                'description': 'Systemic infection, boll rot visible, 20-50% plant affected',
                'chemical': {
                    'primary':     {'name': 'Kasugamycin 3% SL',         'dosage': '2ml/L', 'cost': 'Rs.400-600/acre'},
                    'alternative': {'name': 'Copper oxychloride 50% WP', 'dosage': '3g/L',  'cost': 'Rs.300-450/acre'},
                    'application': '3 sprays at 7-day intervals, include stem base drench',
                    'safety':      'Full PPE, 10-day withdrawal, avoid runoff into water',
                },
                'organic': {
                    'primary':       {'name': 'Copper fungicide + Neem oil combo', 'dosage': '2g + 5ml/L', 'frequency': 'Every 7 days'},
                    'effectiveness': '55-65%',
                },
                'cultural': ['Remove and destroy infected bolls immediately', 'Reduce irrigation frequency', 'Apply potassium-based fertilizer to boost immunity'],
            },
            'Critical': {
                'description': 'Stem cankers, >50% plant damage, severe boll rot, crop loss likely',
                'chemical': {
                    'primary':     {'name': 'Kasugamycin + Copper oxychloride (rotation)', 'dosage': 'Full label rates', 'cost': 'Rs.750-1100/acre'},
                    'alternative': {'name': 'Streptomycin sulfate 90% SP', 'dosage': '0.1g/L', 'cost': 'Rs.500-750/acre'},
                    'application': 'Spray every 5 days, drench stem base, cover entire canopy',
                    'safety':      'Full PPE mandatory, 10-day withdrawal, avoid applying before rain',
                },
                'organic': {
                    'primary':       {'name': 'Not recommended as primary treatment at this stage'},
                    'note':          'Chemical intervention mandatory; organics not effective for stem cankers',
                    'effectiveness': '30-40%',
                },
                'cultural': ['Destroy all crop residue after harvest', 'Avoid replanting cotton for at least one season', 'Deep plowing to bury infected material'],
            },
        },
        'urgency': {
            'Mild':     'Apply copper spray within 5 days',
            'Moderate': 'Begin antibiotic + copper protocol within 2 days',
            'Severe':   'Immediate treatment; remove severely infected plants',
            'Critical': 'Consult plant pathologist; consider field quarantine',
        },
        'recovery_days': {
            'Mild': '10-14 days', 'Moderate': '14-21 days',
            'Severe': '21-30 days', 'Critical': '30-45 days',
        },
        'preventive': ['Disease-free seeds', 'Avoid overhead irrigation', 'Remove infected parts', 'Proper spacing', 'Crop rotation'],
    },

    'Powdery Mildew': {
        'disease_info': {
            'scientific_name': 'Leveillula taurica',
            'common_name': 'Powdery Mildew',
            'type': 'fungal',
            'symptoms': ['White powdery growth', 'Yellowing', 'Leaf drop', 'Reduced yield'],
            'spread': 'Wind-borne spores',
            'favorable_conditions': 'Moderate temperature, high humidity',
        },
        'severity_based_treatment': {
            'Mild': {
                'description': 'Early white patches on a few leaves, <10% foliage affected',
                'chemical': None,
                'organic': {
                    'primary':       {'name': 'Potassium bicarbonate', 'dosage': '5g/L',  'frequency': 'Every 7 days'},
                    'alternative':   {'name': 'Neem oil',              'dosage': '5ml/L', 'frequency': 'Every 7 days'},
                    'note':          'Most effective as preventive; apply at first sign',
                    'effectiveness': '70-80%',
                },
                'cultural': ['Improve air circulation between plants', 'Remove and destroy affected leaves', 'Avoid excess nitrogen fertilizer'],
            },
            'Moderate': {
                'description': 'Spreading powdery growth, 10-25% foliage coverage',
                'chemical': {
                    'primary':     {'name': 'Sulfur 80% WP', 'dosage': '2g/L', 'cost': 'Rs.300-450/acre'},
                    'application': '2-3 sprays at 15-day intervals; do not apply when temp >35C',
                    'safety':      'Temperature sensitive, wear mask, 7-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Sulfur dust',           'dosage': 'Dust application', 'frequency': 'Weekly'},
                    'alternative':   {'name': 'Potassium bicarbonate', 'dosage': '5g/L',             'frequency': 'Every 7 days'},
                    'effectiveness': '70-75%',
                },
                'cultural': ['Avoid dense planting', 'Basal watering only (no overhead)', 'Reduce canopy humidity'],
            },
            'Severe': {
                'description': 'Heavy powdery coverage, yellowing widespread, leaf drop starting',
                'chemical': {
                    'primary':     {'name': 'Hexaconazole 5% EC',   'dosage': '2ml/L', 'cost': 'Rs.500-700/acre'},
                    'alternative': {'name': 'Propiconazole 25% EC', 'dosage': '1ml/L', 'cost': 'Rs.450-650/acre'},
                    'application': '3 sprays at 10-day intervals; rotate fungicide groups',
                    'safety':      'Avoid application in heat; 7-day withdrawal, PPE required',
                },
                'organic': {
                    'primary':       {'name': 'Neem oil', 'dosage': '5ml/L', 'frequency': 'Every 5 days'},
                    'note':          'Partial control only at this severity',
                    'effectiveness': '55-65%',
                },
                'cultural': ['Remove heavily infected leaves aggressively', 'Increase inter-row spacing if possible', 'Apply silicon-based foliar spray to strengthen cell walls'],
            },
            'Critical': {
                'description': 'Total foliage loss risk, >50% plant affected, yield severely impacted',
                'chemical': {
                    'primary':     {'name': 'Hexaconazole + Sulfur WP (alternate)', 'dosage': 'Full label rates', 'cost': 'Rs.800-1150/acre'},
                    'alternative': {'name': 'Tebuconazole 25.9% EC',               'dosage': '1ml/L',            'cost': 'Rs.600-850/acre'},
                    'application': 'Spray every 7 days alternating fungicide groups; mandatory rotation to prevent resistance',
                    'safety':      'Check temperature before application, full PPE, 7-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Minimal efficacy at this stage'},
                    'note':          'Chemical treatment required; organics as supplement only',
                    'effectiveness': '30-40%',
                },
                'cultural': ['Aggressive pruning of infected tissue', 'Increase inter-plant spacing immediately', 'Evaluate economic viability of continued treatment'],
            },
        },
        'urgency': {
            'Mild':     'Apply sulphur or bicarbonate within 4 days',
            'Moderate': 'Apply fungicide within 3 days; repeat in 7 days',
            'Severe':   'Immediate fungicide application; remove infected leaves',
            'Critical': 'Aggressive spray programme; seek mycologist advice',
        },
        'recovery_days': {
            'Mild': '5-7 days', 'Moderate': '7-14 days',
            'Severe': '14-21 days', 'Critical': '21-30 days',
        },
        'preventive': ['Good air circulation', 'Avoid dense planting', 'Remove infected leaves', 'Reduce nitrogen', 'Basal watering'],
    },

    'Target spot': {
        'disease_info': {
            'scientific_name': 'Corynespora cassiicola',
            'common_name': 'Target Spot',
            'type': 'fungal',
            'symptoms': ['Circular spots', 'Concentric rings', 'Yellowing', 'Defoliation'],
            'spread': 'Rain splash, wind',
            'favorable_conditions': 'Warm humid conditions',
        },
        'severity_based_treatment': {
            'Mild': {
                'description': 'Few spots (<5 per leaf), no coalescing, <10% canopy affected',
                'chemical': None,
                'organic': {
                    'primary':       {'name': 'Neem oil',         'dosage': '5ml/L', 'frequency': 'Every 7 days'},
                    'alternative':   {'name': 'Copper fungicide', 'dosage': '2g/L',  'frequency': 'Every 10 days'},
                    'note':          'Apply before rain for best results',
                    'effectiveness': '65-75%',
                },
                'cultural': ['Remove fallen debris promptly', 'Avoid excess irrigation', 'Improve field drainage'],
            },
            'Moderate': {
                'description': 'Multiple spots per leaf, starting to coalesce, 10-30% canopy affected',
                'chemical': {
                    'primary':     {'name': 'Mancozeb 75% WP',       'dosage': '2g/L', 'cost': 'Rs.400-600/acre'},
                    'alternative': {'name': 'Chlorothalonil 75% WP', 'dosage': '2g/L', 'cost': 'Rs.450-650/acre'},
                    'application': '2-3 sprays at 10-15 day intervals',
                    'safety':      'Rotate fungicide groups to prevent resistance, 14-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Copper fungicide', 'dosage': '2g/L', 'frequency': 'Every 10 days'},
                    'effectiveness': '65-70%',
                },
                'cultural': ['Crop rotation with non-host crops', 'Use resistant varieties', 'Balanced NPK nutrition'],
            },
            'Severe': {
                'description': 'Coalescing spots, early defoliation, 30-50% canopy lost',
                'chemical': {
                    'primary':     {'name': 'Azoxystrobin 23% SC',   'dosage': '1ml/L', 'cost': 'Rs.600-800/acre'},
                    'alternative': {'name': 'Tebuconazole 25.9% EC', 'dosage': '1ml/L', 'cost': 'Rs.500-700/acre'},
                    'application': '3 sprays at 10-day intervals; rotate between Groups 11 and 3',
                    'safety':      'Strict fungicide group rotation mandatory, 14-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Copper fungicide + Neem oil combo', 'dosage': '2g + 5ml/L', 'frequency': 'Every 7 days'},
                    'effectiveness': '60-70%',
                },
                'cultural': ['Remove all defoliated debris immediately', 'Reduce canopy humidity by pruning lower leaves', 'Avoid late evening irrigation'],
            },
            'Critical': {
                'description': 'Severe defoliation >50%, boll exposure, yield loss certain',
                'chemical': {
                    'primary':     {'name': 'Azoxystrobin + Mancozeb (rotation)', 'dosage': 'Full label rates', 'cost': 'Rs.1000-1400/acre'},
                    'alternative': {'name': 'Picoxystrobin 22.52% SC',            'dosage': '0.5ml/L',         'cost': 'Rs.800-1100/acre'},
                    'application': 'Spray every 7 days; mandatory rotation between fungicide groups 11, 3, and M',
                    'safety':      'Strict group rotation to prevent resistance; 14-day withdrawal',
                },
                'organic': {
                    'primary':       {'name': 'Not adequate as standalone at this stage'},
                    'note':          'Use as supplement to chemical program only',
                    'effectiveness': '35-45%',
                },
                'cultural': ['Early harvest if crop near maturity', 'Full field debris removal and destruction post-harvest', 'Deep plow to bury infected material'],
            },
        },
        'urgency': {
            'Mild':     'Apply preventive fungicide within 5 days',
            'Moderate': 'Curative spray within 2 days; remove spotty leaves',
            'Severe':   'Immediate treatment; repeat in 10 days',
            'Critical': 'Emergency protocol; consider partial crop removal',
        },
        'recovery_days': {
            'Mild': '7-10 days', 'Moderate': '10-14 days',
            'Severe': '14-21 days', 'Critical': '21-35 days',
        },
        'preventive': ['Crop rotation', 'Remove debris', 'Avoid excess irrigation', 'Resistant varieties', 'Balanced nutrition'],
    },

    'Healthy': {
        'disease_info': {
            'scientific_name': 'N/A',
            'common_name': 'Healthy Plant',
            'type': 'none',
            'symptoms': ['No disease symptoms'],
            'spread': 'N/A',
            'favorable_conditions': 'N/A',
        },
        'severity_based_treatment': {
            'None': {
                'description': 'No disease detected; plant is in good health',
                'chemical': None,
                'organic': {
                    'primary': {'name': 'Continue routine monitoring', 'dosage': 'N/A', 'frequency': 'Weekly scouting'},
                    'note':    'No treatment required',
                },
                'cultural': ['Regular field monitoring', 'Maintain soil health', 'Proper irrigation scheduling', 'Balanced fertilization'],
            },
        },
        'urgency':       {'None': 'No action required'},
        'recovery_days': {'None': 'N/A'},
        'preventive': ['Regular monitoring', 'Maintain soil health', 'Proper irrigation', 'Balanced fertilization', 'Good practices'],
    },
}

SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe', 'Critical']

SEVERITY_DESCRIPTIONS = {
    'Mild':     'Early detection; minimal intervention needed',
    'Moderate': 'Moderate spread; targeted treatment recommended',
    'Severe':   'Severe infection; aggressive chemical treatment required',
    'Critical': 'Crop loss risk; emergency intervention and expert consultation needed',
    'None':     'No disease detected; plant is healthy',
}


def get_treatment(disease: str) -> dict | None:
    """Return the full treatment record for a disease."""
    return TREATMENT_DATABASE.get(disease)


def get_treatment_by_severity(disease: str, severity: str) -> dict | None:
    """
    Return the severity-specific treatment block.

    Args:
        disease  : e.g. 'Aphids', 'Powdery Mildew'
        severity : 'Mild' | 'Moderate' | 'Severe' | 'Critical'  (or 'None' for Healthy)
    """
    record = TREATMENT_DATABASE.get(disease)
    if not record:
        return None
    return record.get('severity_based_treatment', {}).get(severity)


def get_all_diseases() -> list[str]:
    """Return list of all disease names."""
    return list(TREATMENT_DATABASE.keys())


def get_diseases_by_type(disease_type: str) -> list[str]:
    """Filter diseases by type ('pest', 'fungal', 'bacterial', 'none')."""
    return [
        name for name, data in TREATMENT_DATABASE.items()
        if data.get('disease_info', {}).get('type') == disease_type
    ]


def get_chemical_treatment(disease: str, severity: str | None = None) -> dict | None:
    """Return chemical treatment, optionally filtered by severity."""
    record = TREATMENT_DATABASE.get(disease)
    if not record:
        return None
    if severity:
        sev_data = record.get('severity_based_treatment', {}).get(severity, {})
        return sev_data.get('chemical')
    moderate = record.get('severity_based_treatment', {}).get('Moderate', {})
    return moderate.get('chemical')


def get_organic_treatment(disease: str, severity: str | None = None) -> dict | None:
    """Return organic treatment, optionally filtered by severity."""
    record = TREATMENT_DATABASE.get(disease)
    if not record:
        return None
    if severity:
        sev_data = record.get('severity_based_treatment', {}).get(severity, {})
        return sev_data.get('organic')
    mild = record.get('severity_based_treatment', {}).get('Mild', {})
    return mild.get('organic')


def get_preventive_measures(disease: str) -> list[str] | None:
    """Return preventive measures for a disease."""
    record = TREATMENT_DATABASE.get(disease)
    return record.get('preventive') if record else None


def get_disease_info(disease: str) -> dict | None:
    """Return disease metadata."""
    record = TREATMENT_DATABASE.get(disease)
    return record.get('disease_info') if record else None


def recommend_treatment(disease: str, severity: str) -> dict:
    """
    Generate a structured treatment recommendation summary.

    Args:
        disease  : Disease name
        severity : 'Mild' | 'Moderate' | 'Severe' | 'Critical'

    Returns:
        dict with disease info, severity plan, urgency, recovery, and preventives.
    """
    record = TREATMENT_DATABASE.get(disease)
    if not record:
        return {'error': f"Disease '{disease}' not found in database."}

    sev_key = severity if severity in ('Mild', 'Moderate', 'Severe', 'Critical', 'None') else 'Mild'
    sev_plan = record.get('severity_based_treatment', {}).get(sev_key)
    if not sev_plan:
        return {'error': f"Severity '{severity}' not available for '{disease}'."}

    return {
        'disease':              disease,
        'severity':             sev_key,
        'severity_description': SEVERITY_DESCRIPTIONS.get(sev_key, ''),
        'disease_info':         record.get('disease_info'),
        'treatment_plan':       sev_plan,
        'urgency':              record.get('urgency', {}).get(sev_key, 'Treat promptly'),
        'recovery_days':        record.get('recovery_days', {}).get(sev_key, 'Unknown'),
        'preventive_measures':  record.get('preventive', []),
    }
