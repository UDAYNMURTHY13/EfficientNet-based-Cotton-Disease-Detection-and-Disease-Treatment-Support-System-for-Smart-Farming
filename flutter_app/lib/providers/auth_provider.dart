import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _user;
  bool _loading = false;

  AuthProvider(String? initialToken) {
    _token = initialToken;
  }

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get loading => _loading;

  String get userName => _user?['full_name'] ?? _user?['first_name'] ?? 'User';
  String get userEmail => _user?['email'] ?? '';

  /// Tries to load the current user from the backend using the stored token.
  Future<void> loadUser() async {
    if (_token == null) return;
    try {
      final user = await ApiService.instance.getMe(_token!);
      if (user != null) {
        _user = user;
        notifyListeners();
      }
    } catch (_) {}
  }

  /// Performs login and stores the token.
  /// Returns null on success, or an error string on failure.
  Future<String?> login(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final result = await ApiService.instance.login(email, password);
      if (result != null && result.containsKey('access_token')) {
        _token = result['access_token'] as String;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        _loading = false;
        notifyListeners();
        // Load user profile in the background
        loadUser();
        return null; // null = success
      } else {
        _loading = false;
        notifyListeners();
        return 'Invalid response from server';
      }
    } catch (e) {
      _loading = false;
      notifyListeners();
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  /// Logs out and clears all stored credentials.
  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    notifyListeners();
  }
}
