import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';

/// Single source of truth for all backend URLs and shared Dio options.
class ApiConfig {
  static const String _defaultIp  = '192.168.1.8';
  static const String _serverIpKey = 'server_ip';

  // In-memory cache — populated by init() at app startup.
  static String _cachedIp = _defaultIp;

  /// Call once in main() before runApp to load the stored IP.
  static Future<void> init() async {
    if (kIsWeb) return;
    final prefs = await SharedPreferences.getInstance();
    _cachedIp = prefs.getString(_serverIpKey) ?? _defaultIp;
  }

  /// Persist a new server IP and update the in-memory cache immediately.
  static Future<void> setServerIp(String ip) async {
    _cachedIp = ip.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_serverIpKey, ip.trim());
  }

  static String get serverIp => _cachedIp;

  /// Node.js Express — the main backend (auth, projects, applications, AI proxy).
  static String get nodeApi =>
      kIsWeb ? 'http://localhost:3000/api' : 'http://$_cachedIp:3000/api';

  /// Chat requests go through the Node.js proxy — API key never exposed on device.
  static String get chatUrl => '$nodeApi/ai/chat';

  /// OCR requests go through the Node.js proxy.
  static String get ocrUrl => '$nodeApi/ocr/extract';

  /// Returns Dio [Options] with the stored JWT as an Authorization header.
  /// Use: `options: await ApiConfig.authOptions`
  static Future<Options> get authOptions async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    return Options(
      headers: token.isNotEmpty ? {'Authorization': 'Bearer $token'} : {},
    );
  }
}
