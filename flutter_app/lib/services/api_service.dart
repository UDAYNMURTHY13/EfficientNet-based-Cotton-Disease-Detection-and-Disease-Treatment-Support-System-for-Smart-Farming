import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Central API service wired to the CottonCare FastAPI backend.
///
/// Base URL default is 10.0.2.2:8000 (Android emulator → host machine).
/// For a physical device change [baseUrl] to your machine's LAN IP e.g. 192.168.x.x:8000.
class ApiService {
  static ApiService? _instance;
  static ApiService get instance {
    _instance ??= ApiService._internal();
    return _instance!;
  }

  // Auto-selects the right host:
  //   Web/Chrome  → localhost (same machine)
  //   Android emulator → 10.0.2.2 (maps to host localhost)
  //   Physical device → set PHYSICAL_DEVICE_IP to your PC's LAN IP
  static const String _physicalDeviceIp = '10.43.13.38';

  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    if (_physicalDeviceIp.isNotEmpty) return 'http://$_physicalDeviceIp:8000';
    return 'http://10.0.2.2:8000'; // Android emulator default
  }

  late final Dio _dio;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );
    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(requestBody: false, responseBody: false,
            logPrint: (o) => debugPrint(o.toString())),
      );
    }
  }

  // ────────────────────────── helpers ──────────────────────────

  Future<Options> _authOpts() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    return Options(headers: {'Authorization': 'Bearer $token'});
  }

  // ────────────────────────── AUTH ──────────────────────────

  /// Login with email + password. Returns token map on success.
  Future<Map<String, dynamic>?> login(String email, String password) async {
    final response = await _dio.post(
      '/api/v1/auth/login',
      data: {'email': email, 'password': password},
      options: Options(contentType: Headers.jsonContentType),
    );
    return response.data as Map<String, dynamic>;
  }

  /// Register a new account.
  Future<Map<String, dynamic>?> register({
    required String email,
    required String password,
    required String firstName,
    String? phone,
    String? location,
  }) async {
    final response = await _dio.post(
      '/api/v1/auth/register',
      data: {
        'email': email,
        'password': password,
        'first_name': firstName,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (location != null && location.isNotEmpty) 'location': location,
      },
      options: Options(contentType: Headers.jsonContentType),
    );
    return response.data as Map<String, dynamic>;
  }

  /// Fetch current user profile (needs valid token).
  Future<Map<String, dynamic>?> getMe(String token) async {
    try {
      final response = await _dio.get(
        '/api/v1/auth/me',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('getMe error: $e');
      return null;
    }
  }

  // ────────────────────────── ANALYSIS ──────────────────────────

  /// Upload a leaf image for disease analysis.
  Future<Map<String, dynamic>> analyzeImage(
    XFile imageFile, {
    double? latitude,
    double? longitude,
    double? locationAccuracy,
    String? locationName,
  }) async {
    final opts = await _authOpts();
    final MultipartFile multipart;
    if (kIsWeb) {
      // On web dart:io is unavailable — read bytes directly from XFile
      final bytes = await imageFile.readAsBytes();
      multipart = MultipartFile.fromBytes(bytes,
          filename: imageFile.name.isNotEmpty ? imageFile.name : 'leaf.jpg');
    } else {
      multipart = await MultipartFile.fromFile(imageFile.path,
          filename: imageFile.name.isNotEmpty ? imageFile.name : 'leaf.jpg');
    }
    final formData = FormData.fromMap({'file': multipart});
    final queryParams = <String, dynamic>{};
    if (latitude != null) queryParams['latitude'] = latitude;
    if (longitude != null) queryParams['longitude'] = longitude;
    if (locationAccuracy != null) queryParams['location_accuracy'] = locationAccuracy;
    if (locationName != null && locationName.isNotEmpty) queryParams['location_name'] = locationName;
    final response = await _dio.post(
      '/api/v1/analysis/analyze',
      data: formData,
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
      options: opts,
    );
    return response.data as Map<String, dynamic>;
  }

  /// Fetch paginated scan history.
  Future<Map<String, dynamic>> getHistory({int page = 1, int pageSize = 20}) async {
    final opts = await _authOpts();
    final response = await _dio.get(
      '/api/v1/analysis/history',
      queryParameters: {'page': page, 'page_size': pageSize},
      options: opts,
    );
    return response.data as Map<String, dynamic>;
  }

  /// Fetch dashboard statistics.
  Future<Map<String, dynamic>> getStats() async {
    final opts = await _authOpts();
    final response = await _dio.get('/api/v1/analysis/stats', options: opts);
    return response.data as Map<String, dynamic>;
  }

  // ────────────── legacy stubs kept so old imports still compile ──────────────

  Future<bool> healthCheck() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<List<dynamic>> getAllDiseases() async {
    try {
      final response = await _dio.get('/diseases');

      if (response.statusCode == 200) {
        return response.data as List<dynamic>;
      } else {
        return [];
      }
    } catch (_) {
      return [];
    }
  }
}

