# Flutter Mobile App Setup Guide

## Prerequisites
- Flutter SDK (v3.0 or higher)
- Android Studio or Xcode (for iOS)
- Visual Studio Code or Android Studio IDE
- Git

## Installation Steps

### 1. Install Flutter
```bash
# Download Flutter SDK from https://flutter.dev/docs/get-started/install
# Add Flutter to your PATH

# Verify installation
flutter --version
flutter doctor
```

### 2. Create Flutter Project
```bash
flutter create cotton_care_app
cd cotton_care_app
```

### 3. Setup Project Structure
```bash
# Copy the provided files to lib/ directory
# Replace pubspec.yaml with the provided version
```

### 4. Install Dependencies
```bash
flutter pub get
```

### 5. Generate Build Files (for JSON serialization)
```bash
flutter pub run build_runner build
```

### 6. Configure API URL
Edit `lib/utils/constants.dart` and set the API base URL:
```dart
static const String apiBaseUrl = 'http://YOUR_IP:8000';
```

### 7. Run the App

**Android:**
```bash
flutter run -d android
```

**iOS:**
```bash
flutter run -d ios
```

**Web (for testing):**
```bash
flutter run -d web
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/
│   ├── disease.dart         # Disease model
│   ├── prediction.dart      # Prediction model
│   └── treatment.dart       # Treatment model
├── services/
│   ├── api_service.dart     # API communication
│   ├── storage_service.dart # Local database
│   └── camera_service.dart  # Camera integration
├── screens/
│   ├── splash_screen.dart   # Splash screen
│   ├── login_screen.dart    # Login
│   ├── home_screen.dart     # Home/Main screen
│   ├── camera_screen.dart   # Camera & upload
│   ├── results_screen.dart  # Results display
│   └── history_screen.dart  # Scan history
├── widgets/
│   └── (UI components)
└── utils/
    ├── theme.dart           # App theming
    └── constants.dart       # App constants
```

## Key Features

### 1. Camera Integration
- Uses `image_picker` package
- Capture from camera or select from gallery
- Image compression before upload

### 2. Local Database
- SQLite using `sqflite` package
- Offline scan history storage
- Sync support for when online

### 3. API Integration
- Dio HTTP client with interceptors
- Automatic token management
- Retry logic for failed requests

### 4. State Management
- Provider package for state management
- Context API for global state

## Configuration

### Environment Variables (.env)
Create a `.env` file in project root:
```
API_BASE_URL=http://192.168.1.100:8000
API_TIMEOUT=30000
ENABLE_OFFLINE_MODE=true
ENABLE_NOTIFICATIONS=true
```

### Firebase Setup (Optional)
1. Create Firebase project at https://firebase.google.com
2. Add iOS and Android apps
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Place in appropriate directories

## Build & Release

### Android APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS Release
```bash
flutter build ios --release
# Follow Xcode instructions for App Store submission
```

## Testing

```bash
# Run all tests
flutter test

# Run tests with coverage
flutter test --coverage
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API server is running
   - Verify API URL in constants.dart
   - Check firewall settings

2. **Camera Permission Denied**
   - Check AndroidManifest.xml permissions
   - Request runtime permissions
   - Grant app permissions in Settings

3. **SQLite Database Issues**
   - Clear app data: `flutter clean`
   - Rebuild: `flutter pub get && flutter pub run build_runner build`

4. **Build Errors**
   - Run `flutter clean`
   - Delete .pub-cache: `rm -rf ~/.pub-cache`
   - Rerun `flutter pub get`

## Performance Optimization

- Use `const` constructors where possible
- Implement lazy loading for lists
- Cache API responses
- Optimize image sizes
- Use `SingleChildScrollView` carefully to avoid layout issues

## Security Best Practices

1. **API Security**
   - Use HTTPS in production
   - Implement SSL pinning
   - Validate certificates

2. **Data Storage**
   - Encrypt sensitive data
   - Use secure storage for tokens
   - Clear sensitive data on logout

3. **Input Validation**
   - Validate all user inputs
   - Sanitize data before sending
   - Handle errors gracefully

## Deployment Checklist

- [ ] Update version number in pubspec.yaml
- [ ] Update app name and icon
- [ ] Configure API production URL
- [ ] Enable analytics and crash reporting
- [ ] Test on multiple devices
- [ ] Implement proper error handling
- [ ] Add privacy policy and terms
- [ ] Generate signing keys for release builds
- [ ] Create app store listing
- [ ] Submit for review

## Support & Documentation

- Flutter Official: https://flutter.dev/docs
- Dart Documentation: https://dart.dev/guides
- Pub.dev Packages: https://pub.dev
- Stack Overflow: Tag `flutter`

## Next Steps

1. Implement camera integration
2. Add image preprocessing
3. Implement push notifications
4. Add offline mode support
5. Integrate Firebase Analytics
6. Create unit and integration tests
7. Optimize performance
8. Submit to app stores
