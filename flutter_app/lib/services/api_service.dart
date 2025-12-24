import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/disease.dart';
import '../models/prediction.dart';
import '../models/treatment.dart';

class ApiService {
  static const String _baseUrl = 'http://192.168.1.100:8000'; // Configure for your setup
  static const Duration _timeout = Duration(seconds: 30);

  late Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: _timeout,
        receiveTimeout: _timeout,
        contentType: Headers.jsonContentType,
      ),
    );

    // Add logging interceptor
    _dio.interceptors.add(LoggingInterceptor());
  }

  /// Health check for API availability
  Future<bool> healthCheck() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Health check failed: $e');
      return false;
    }
  }

  /// Send image for disease prediction with XAI
  Future<Map<String, dynamic>> predictDisease(String imagePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(imagePath),
      });

      final response = await _dio.post(
        '/predict/xai',
        data: formData,
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Prediction failed with status ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Prediction error: $e');
      rethrow;
    }
  }

  /// Get treatment information for a disease
  Future<Treatment> getTreatment(String disease) async {
    try {
      final response = await _dio.get('/treatment/$disease');

      if (response.statusCode == 200) {
        return Treatment.fromJson(response.data);
      } else {
        throw Exception('Failed to fetch treatment');
      }
    } catch (e) {
      debugPrint('Treatment fetch error: $e');
      rethrow;
    }
  }

  /// Get all diseases
  Future<List<Disease>> getAllDiseases() async {
    try {
      final response = await _dio.get('/diseases');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((item) => Disease.fromJson(item)).toList();
      } else {
        throw Exception('Failed to fetch diseases');
      }
    } catch (e) {
      debugPrint('Disease fetch error: $e');
      rethrow;
    }
  }

  /// Get specific disease details
  Future<Disease> getDiseaseDetails(String diseaseName) async {
    try {
      final response = await _dio.get('/diseases/$diseaseName');

      if (response.statusCode == 200) {
        return Disease.fromJson(response.data);
      } else {
        throw Exception('Failed to fetch disease details');
      }
    } catch (e) {
      debugPrint('Disease details fetch error: $e');
      rethrow;
    }
  }

  /// Sync predictions to server
  Future<bool> syncPredictions(List<Prediction> predictions) async {
    try {
      final data = predictions.map((p) => p.toJson()).toList();
      final response = await _dio.post('/sync/predictions', data: {'predictions': data});

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Sync error: $e');
      rethrow;
    }
  }

  /// Set the base URL (useful for configuration)
  void setBaseUrl(String baseUrl) {
    _dio.options.baseUrl = baseUrl;
  }

  /// Get current base URL
  String getBaseUrl() => _dio.options.baseUrl;
}

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('🔵 REQUEST[${options.method}] => PATH: ${options.path}');
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint(
      '✅ RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}',
    );
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint(
      '❌ ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}',
    );
    super.onError(err, handler);
  }
}
