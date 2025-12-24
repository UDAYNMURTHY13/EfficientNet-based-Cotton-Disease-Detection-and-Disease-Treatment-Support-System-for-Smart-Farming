TREATMENT_DATABASE = {
    'Aphids': {
        'disease_info': {
            'scientific_name': 'Aphis gossypii',
            'common_name': 'Cotton Aphid',
            'symptoms': ['Curled leaves', 'Stunted growth', 'Honeydew secretion', 'Sooty mold', 'Yellowing'],
            'spread': 'Wind, ants, contaminated tools',
            'favorable_conditions': 'Cool weather, high nitrogen'
        },
        'chemical': {
            'primary': {'name': 'Imidacloprid 17.8% SL', 'dosage': '0.5ml/L', 'cost': '₹400-600/acre'},
            'alternative': {'name': 'Thiamethoxam 25% WG', 'dosage': '0.2g/L', 'cost': '₹500-700/acre'},
            'application': 'Spray on leaf undersides, repeat after 10 days',
            'safety': 'Wear PPE, avoid drift, 7-day withdrawal'
        },
        'organic': {
            'primary': {'name': 'Neem oil 1500ppm', 'dosage': '5ml/L', 'frequency': 'Every 5-7 days'},
            'alternative': {'name': 'Insecticidal soap', 'dosage': '10ml/L', 'frequency': 'Every 5 days'},
            'effectiveness': '70-80%'
        },
        'preventive': ['Remove weeds', 'Yellow sticky traps', 'Encourage ladybugs', 'Balanced fertilization', 'Proper spacing']
    },
    'Army worm': {
        'disease_info': {
            'scientific_name': 'Spodoptera litura',
            'common_name': 'Cotton Leafworm',
            'symptoms': ['Irregular holes', 'Defoliation', 'Frass on leaves', 'Skeletonized leaves'],
            'spread': 'Adult moths, wind',
            'favorable_conditions': 'Warm humid weather'
        },
        'chemical': {
            'primary': {'name': 'Chlorantraniliprole 18.5% SC', 'dosage': '0.3ml/L', 'cost': '₹500-700/acre'},
            'alternative': {'name': 'Emamectin benzoate 5% SG', 'dosage': '0.4g/L', 'cost': '₹600-800/acre'},
            'application': 'Early morning/evening spray, target larvae',
            'safety': 'PPE required, 14-day withdrawal'
        },
        'organic': {
            'primary': {'name': 'Bacillus thuringiensis', 'dosage': '1-2g/L', 'frequency': 'Every 7 days'},
            'alternative': {'name': 'Neem extract', 'dosage': '5ml/L', 'frequency': 'Every 5 days'},
            'effectiveness': '75-85%'
        },
        'preventive': ['Pheromone traps', 'Hand-picking', 'Deep plowing', 'Crop rotation', 'Regular monitoring']
    },
    'Bacterial Blight': {
        'disease_info': {
            'scientific_name': 'Xanthomonas citri pv. malvacearum',
            'common_name': 'Angular Leaf Spot',
            'symptoms': ['Water-soaked lesions', 'Angular spots', 'Boll rot', 'Stem cankers'],
            'spread': 'Rain splash, contaminated seeds, tools',
            'favorable_conditions': 'High humidity, warm temperature'
        },
        'chemical': {
            'primary': {'name': 'Streptocycline 300ppm + Copper oxychloride 0.25%', 'dosage': 'As specified', 'cost': '₹350-500/acre'},
            'alternative': {'name': 'Kasugamycin 3% SL', 'dosage': '2ml/L', 'cost': '₹400-600/acre'},
            'application': '2-3 sprays at 10-day intervals',
            'safety': 'Avoid flowering period, 10-day withdrawal'
        },
        'organic': {
            'primary': {'name': 'Bordeaux mixture 1%', 'dosage': 'As per label', 'frequency': 'Every 10-15 days'},
            'alternative': {'name': 'Copper hydroxide', 'dosage': '2g/L', 'frequency': 'Every 10 days'},
            'effectiveness': '60-70%'
        },
        'preventive': ['Disease-free seeds', 'Avoid overhead irrigation', 'Remove infected parts', 'Proper spacing', 'Crop rotation']
    },
    'Powdery Mildew': {
        'disease_info': {
            'scientific_name': 'Leveillula taurica',
            'common_name': 'Powdery Mildew',
            'symptoms': ['White powdery growth', 'Yellowing', 'Leaf drop', 'Reduced yield'],
            'spread': 'Wind-borne spores',
            'favorable_conditions': 'Moderate temperature, high humidity'
        },
        'chemical': {
            'primary': {'name': 'Sulfur 80% WP', 'dosage': '2g/L', 'cost': '₹300-450/acre'},
            'alternative': {'name': 'Hexaconazole 5% EC', 'dosage': '2ml/L', 'cost': '₹500-700/acre'},
            'application': '2-3 sprays at 15-day intervals, avoid >35°C',
            'safety': 'Temperature sensitive, 7-day withdrawal'
        },
        'organic': {
            'primary': {'name': 'Sulfur dust', 'dosage': 'Dust application', 'frequency': 'Weekly'},
            'alternative': {'name': 'Potassium bicarbonate', 'dosage': '5g/L', 'frequency': 'Every 7 days'},
            'effectiveness': '70-80%'
        },
        'preventive': ['Good air circulation', 'Avoid dense planting', 'Remove infected leaves', 'Reduce nitrogen', 'Basal watering']
    },
    'Target spot': {
        'disease_info': {
            'scientific_name': 'Corynespora cassiicola',
            'common_name': 'Target Spot',
            'symptoms': ['Circular spots', 'Concentric rings', 'Yellowing', 'Defoliation'],
            'spread': 'Rain splash, wind',
            'favorable_conditions': 'Warm humid conditions'
        },
        'chemical': {
            'primary': {'name': 'Azoxystrobin 23% SC', 'dosage': '1ml/L', 'cost': '₹600-800/acre'},
            'alternative': {'name': 'Mancozeb 75% WP', 'dosage': '2g/L', 'cost': '₹400-600/acre'},
            'application': '2-3 sprays at 10-15 day intervals',
            'safety': 'Rotate fungicide groups, 14-day withdrawal'
        },
        'organic': {
            'primary': {'name': 'Copper fungicide', 'dosage': '2g/L', 'frequency': 'Every 10 days'},
            'alternative': {'name': 'Neem oil', 'dosage': '5ml/L', 'frequency': 'Every 7 days'},
            'effectiveness': '65-75%'
        },
        'preventive': ['Crop rotation', 'Remove debris', 'Avoid excess irrigation', 'Resistant varieties', 'Balanced nutrition']
    },
    'Healthy': {
        'disease_info': {
            'scientific_name': 'N/A',
            'common_name': 'Healthy Plant',
            'symptoms': ['No disease symptoms'],
            'spread': 'N/A',
            'favorable_conditions': 'N/A'
        },
        'chemical': {'primary': {'name': 'No treatment needed', 'dosage': 'N/A', 'cost': '₹0'}},
        'organic': {'primary': {'name': 'Continue monitoring', 'dosage': 'N/A', 'frequency': 'N/A'}},
        'preventive': ['Regular monitoring', 'Maintain soil health', 'Proper irrigation', 'Balanced fertilization', 'Good practices']
    }
}

def get_treatment(disease):
    return TREATMENT_DATABASE.get(disease, None)

def get_all_diseases():
    return list(TREATMENT_DATABASE.keys())
