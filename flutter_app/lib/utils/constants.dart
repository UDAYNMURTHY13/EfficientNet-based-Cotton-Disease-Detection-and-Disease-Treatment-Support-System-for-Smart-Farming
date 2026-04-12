class AppConstants {
  // API Configuration
  // 10.0.2.2 maps to host machine localhost from an Android emulator.
  // Change to your machine's LAN IP (e.g. 192.168.1.x) for a physical device.
  static const String apiBaseUrl = 'http://10.0.2.2:8000';
  static const Duration apiTimeout = Duration(seconds: 30);
  static const String minApiVersion = '2.0';

  // App Info
  static const String appName = 'CottonCare AI';
  static const String appVersion = '1.0.0';

  // Local Storage Keys
  static const String userIdKey = 'user_id';
  static const String authTokenKey = 'auth_token';
  static const String lastSyncKey = 'last_sync';
  static const String userPreferencesKey = 'user_preferences';

  // Disease Types
  static const List<String> cottonDiseases = [
    'Bacterial Blight',
    'Fusarium Wilt',
    'Verticillium Wilt',
    'Anthracnose',
    'Purple Seed Stain',
    'Alternaria Leaf Spot',
    'Gray Mold',
    'Healthy',
  ];

  // Severity Levels
  static const List<String> severityLevels = ['Low', 'Medium', 'High'];

  // Image Settings
  static const int imageQuality = 85;
  static const int maxImageWidth = 1024;
  static const int maxImageHeight = 1024;

  // Notification Settings
  static const bool enableNotifications = true;
  static const bool enableOfflineMode = true;
  static const bool enableAutoSync = true;

  // Timeout durations
  static const Duration shortTimeout = Duration(seconds: 5);
  static const Duration mediumTimeout = Duration(seconds: 15);
  static const Duration longTimeout = Duration(seconds: 30);
}
