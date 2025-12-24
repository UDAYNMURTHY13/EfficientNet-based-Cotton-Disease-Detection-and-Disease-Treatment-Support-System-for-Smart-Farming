# Android App Setup Guide

## Prerequisites
- Android Studio (latest version)
- Android SDK 24 or higher
- Java 8 or higher

## Setup Steps

### 1. Open Android Studio
- File → New → New Project
- Select "Empty Activity"
- Name: CottonCare AI
- Package: com.cottoncare.diseasedetection
- Language: Java
- Minimum SDK: API 24

### 2. Replace Files
Copy these files from `android_app/` to your Android Studio project:

```
app/
├── build.gradle → Copy to app/build.gradle
├── src/main/
│   ├── AndroidManifest.xml
│   ├── java/MainActivity.java
│   └── res/activity_main.xml
```

### 3. Update API URL
In `MainActivity.java`, line 38:
```java
private static final String API_URL = "http://YOUR_SERVER_IP:5000/api/v1/predict";
```
Replace `YOUR_SERVER_IP` with:
- Your computer's local IP (e.g., 192.168.1.100)
- Or use ngrok for public URL

### 4. Sync Gradle
- Click "Sync Now" when prompted
- Wait for dependencies to download

### 5. Run the App
- Connect Android device or start emulator
- Click Run (green play button)
- Grant camera and storage permissions

## Features

✅ **Camera Integration** - Take photos directly
✅ **Gallery Access** - Select existing images
✅ **Real-time Analysis** - Instant disease detection
✅ **Treatment Info** - Chemical & organic solutions
✅ **Modern UI** - Material Design components
✅ **Offline Ready** - Cache previous results

## API Configuration

### Using Local Network
1. Find your computer's IP:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
2. Update API_URL in MainActivity.java
3. Ensure phone and computer on same WiFi

### Using ngrok (Public Access)
1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 5000`
3. Copy the HTTPS URL
4. Update API_URL in MainActivity.java

## Troubleshooting

### Network Error
- Check if server is running
- Verify API_URL is correct
- Ensure phone has internet access
- Check firewall settings

### Camera Not Working
- Grant camera permission in app settings
- Check if camera is available on device

### Image Not Uploading
- Check file size (max 10MB)
- Verify image format (JPG, PNG)
- Check network connection

## Building APK

### Debug APK
```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```
APK location: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK
1. Build → Generate Signed Bundle / APK
2. Create keystore (first time only)
3. Select release build type
4. APK location: `app/build/outputs/apk/release/`

## App Structure

```
MainActivity.java
├── openCamera() - Launch camera
├── openGallery() - Open gallery
├── analyzeImage() - Send to API
└── onActivityResult() - Handle image selection

activity_main.xml
├── ImageView - Display selected image
├── Buttons - Camera, Gallery, Analyze
├── ProgressBar - Loading indicator
└── TextViews - Display results
```

## Next Steps

1. **Add Features:**
   - History of scanned images
   - Offline mode with cached data
   - Share results via WhatsApp/SMS
   - Multi-language support

2. **Improve UI:**
   - Add animations
   - Better error messages
   - Loading states
   - Result visualization

3. **Optimize:**
   - Image compression before upload
   - Caching mechanism
   - Background processing
   - Battery optimization

## Publishing to Play Store

1. Create Google Play Console account
2. Generate signed release APK
3. Create app listing
4. Upload APK
5. Set pricing & distribution
6. Submit for review

## Support

For issues or questions:
- Check logs in Android Studio (Logcat)
- Verify API is responding
- Test with Postman first
- Check permissions in AndroidManifest.xml
