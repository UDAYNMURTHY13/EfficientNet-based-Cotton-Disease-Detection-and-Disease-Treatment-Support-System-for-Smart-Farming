# Phase 2: Mobile App Implementation - Cotton Disease Detection

## Overview
Building a Flutter mobile application for farmers to detect cotton diseases in real-time with offline capabilities and cloud sync.

## Project Structure

```
flutter_app/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── models/
│   │   ├── disease.dart         # Disease model
│   │   ├── prediction.dart      # Prediction response model
│   │   └── treatment.dart       # Treatment recommendations
│   ├── services/
│   │   ├── api_service.dart     # FastAPI integration
│   │   ├── storage_service.dart # Local SQLite storage
│   │   └── camera_service.dart  # Camera integration
│   ├── screens/
│   │   ├── home_screen.dart     # Main home screen
│   │   ├── camera_screen.dart   # Camera/upload screen
│   │   ├── results_screen.dart  # Results & diagnosis
│   │   └── history_screen.dart  # Scan history
│   ├── widgets/
│   │   ├── disease_card.dart    # Disease display card
│   │   ├── treatment_widget.dart# Treatment recommendations
│   │   └── loading_widget.dart  # Loading animation
│   └── utils/
│       ├── constants.dart       # App constants
│       ├── theme.dart          # Theme configuration
│       └── helpers.dart        # Utility functions
├── assets/
│   ├── images/
│   ├── icons/
│   └── lottie/
├── pubspec.yaml                # Dependencies
└── README.md
```

## Key Features

### 1. Camera Integration
- Real-time leaf capture
- Image gallery upload
- Image preprocessing & optimization

### 2. Offline Capability
- Local SQLite database for prediction history
- Sync when internet is available
- Offline prediction using TensorFlow Lite

### 3. API Integration
- Connect to FastAPI backend
- Send images for analysis
- Receive XAI explanations & visualizations

### 4. User Interface
- Home screen with quick actions
- Camera screen with live preview
- Results screen with diagnosis & treatment
- History screen with previous scans

### 5. Notifications
- Push notifications for disease alerts
- Reminders for treatment application
- Sync status notifications

## Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # UI
  cupertino_icons: ^1.0.0
  google_fonts: ^5.0.0
  
  # Camera & Image
  image_picker: ^1.0.0
  camera: ^0.10.0
  
  # HTTP & API
  http: ^1.1.0
  dio: ^5.3.0
  
  # Database
  sqflite: ^2.3.0
  path: ^1.8.0
  
  # State Management
  provider: ^6.0.0
  
  # Local Storage
  shared_preferences: ^2.2.0
  
  # ML (On-device inference)
  tflite_flutter: ^0.10.0
  
  # Utilities
  intl: ^0.19.0
  uuid: ^4.0.0
  
  # Loading animations
  lottie: ^2.4.0
```

## API Integration Points

### 1. Disease Prediction
```
POST /predict/xai
- Send: Image file
- Receive: Disease, confidence, severity, XAI analysis
```

### 2. Treatment Information
```
GET /treatment/{disease}
- Receive: Treatment recommendations
```

### 3. Health Check
```
GET /health
- Verify API availability
```

## Implementation Steps

### Step 1: Project Setup
```bash
flutter create cotton_disease_detection
cd cotton_disease_detection
flutter pub get
```

### Step 2: Model Creation
- Create Dart models for API responses
- Implement JSON serialization

### Step 3: Services Implementation
- API service for backend communication
- Storage service for local database
- Camera service for image capture

### Step 4: UI Screens
- Home screen
- Camera/upload screen
- Results display
- History view

### Step 5: State Management
- Provider setup
- Prediction state
- History management

### Step 6: Testing & Deployment
- Unit tests
- Widget tests
- Integration tests
- Build for iOS & Android

## Database Schema (SQLite)

### Predictions Table
```sql
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  image_path TEXT NOT NULL,
  disease TEXT NOT NULL,
  confidence REAL NOT NULL,
  severity TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT FALSE,
  xai_data TEXT
);
```

### History Table
```sql
CREATE TABLE scan_history (
  id TEXT PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  user_notes TEXT,
  treatment_applied TEXT,
  created_at DATETIME,
  FOREIGN KEY(prediction_id) REFERENCES predictions(id)
);
```

## Configuration

### API Configuration
```dart
const String API_BASE_URL = 'http://192.168.x.x:8000';  // Farmer's device
const Duration API_TIMEOUT = Duration(seconds: 30);
```

### App Configuration
```dart
const String APP_VERSION = '1.0.0';
const String APP_NAME = 'CottonCare AI';
const String MIN_API_VERSION = '2.0';
```

## Security Considerations

1. **SSL Pinning**: Implement certificate pinning for API calls
2. **Data Encryption**: Encrypt sensitive data in local storage
3. **Image Privacy**: Delete local images after processing
4. **Authentication**: Add farmer ID/token system

## Offline Sync Strategy

1. **Queue failed requests** locally
2. **Sync when connection available**
3. **Show sync status** to user
4. **Handle conflicts** intelligently

## Push Notifications Setup

1. **Firebase Cloud Messaging**
2. **Alert for severe diseases**
3. **Treatment reminders**
4. **Sync notifications**

## Performance Optimization

- **Image compression** before upload
- **Lazy loading** for history
- **Caching** API responses
- **Background sync** for predictions

## Testing Strategy

### Unit Tests
- Model serialization
- Utility functions
- Business logic

### Widget Tests
- UI components
- Screen navigation
- User interactions

### Integration Tests
- API communication
- Database operations
- End-to-end flows

## Deployment

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

### Distribution
- Google Play Store
- Apple App Store
- APK direct distribution for offline regions

## Next Steps

1. Create Flutter project structure
2. Implement core services
3. Build UI screens
4. Integration with backend
5. Testing & QA
6. App store submission

## Timeline Estimate

- Setup & Models: 2 days
- Services Implementation: 3 days
- UI Development: 5 days
- Integration Testing: 2 days
- Optimization & Polish: 2 days
- **Total: 14 days**

---

**Status**: Ready to implement
**Backend**: ✅ Complete & Running
**Database**: ✅ PostgreSQL ready
**API**: ✅ All endpoints working
