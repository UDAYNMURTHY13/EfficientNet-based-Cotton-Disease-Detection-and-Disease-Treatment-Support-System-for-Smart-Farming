# Cotton Disease Detection and Treatment Support System

AI-powered system using EfficientNet for detecting cotton leaf diseases and providing treatment recommendations.

## Features
- **Disease Detection**: Identifies Aphids, Army worm, Bacterial Blight, Powdery Mildew, Target spot, and Healthy leaves
- **Severity Estimation**: Classifies disease severity (Mild, Moderate, Severe, Critical)
- **Treatment Recommendations**: Provides chemical, organic, and preventive solutions
- **User-Friendly Interface**: Simple web interface for farmers

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open browser and navigate to:
```
http://localhost:5000
```

## Usage
1. Upload a cotton leaf image
2. Click "Analyze Image"
3. View disease detection results, severity, and treatment recommendations

## Model Details
- Architecture: EfficientNet (Transfer Learning)
- Input Size: 224×224 pixels
- Classes: 6 (5 diseases + healthy)
- Pre-trained on ImageNet

## Treatment Database
The system provides:
- **Chemical treatments**: Specific pesticides/fungicides with dosage
- **Organic alternatives**: Eco-friendly solutions
- **Preventive measures**: Best practices to avoid recurrence

## Project Structure
```
Major-project/
├── app.py                      # Flask backend
├── cotton_model_final.keras    # Trained model
├── requirements.txt            # Dependencies
├── templates/
│   └── index.html             # Frontend interface
└── README.md                  # Documentation
```
