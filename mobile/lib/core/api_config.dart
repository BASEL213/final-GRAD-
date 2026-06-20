import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';

/// Single source of truth for all backend URLs and shared Dio options.
class ApiConfig {
  static const String _defaultIp  = 'findoor-backend.onrender.com';
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
      kIsWeb ? 'http://localhost:3000/api' : 'https://$_cachedIp/api';

  /// Rewrites localhost/127.0.0.1 URLs to the configured server IP so that
  /// images stored by the admin on the PC are accessible from the mobile device.
  static String fixImageUrl(String url) {
    if (kIsWeb || url.isEmpty) return url;
    return url
        .replaceFirst('http://localhost:', 'http://$_cachedIp:')
        .replaceFirst('http://127.0.0.1:', 'http://$_cachedIp:');
  }

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

  /// A Dio instance with the 401-interceptor pre-wired.
  /// Screens that call protected endpoints should use this.
  static Dio get dio {
    final d = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));
    d.interceptors.add(InterceptorsWrapper(
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('auth_token');
          await prefs.remove('user_role');
          final ctx = _navigatorKey.currentContext;
          if (ctx != null && ctx.mounted) {
            Navigator.of(ctx, rootNavigator: true)
                .pushNamedAndRemoveUntil('/login', (_) => false);
          }
        }
        handler.next(e);
      },
    ));
    return d;
  }

  /// Global navigator key — set this on MaterialApp so the interceptor can navigate.
  static final GlobalKey<NavigatorState> _navigatorKey =
      GlobalKey<NavigatorState>();
  static GlobalKey<NavigatorState> get navigatorKey => _navigatorKey;
}
