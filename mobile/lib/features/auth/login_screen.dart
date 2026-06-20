import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/lang.dart';
import 'register_screen.dart';
import 'forgetpassword_screen.dart';
import 'package:findoor_app2/features/home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController    = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isObscured    = true;
  bool _isLoading     = false;
  bool _googleLoading = false;

  // serverClientId = Web Client ID from Firebase Console → Authentication → Google → Web SDK config
  // Replace the string below with YOUR actual Web Client ID
  static const _webClientId = '280204697823-560s9j8p6tjrnbf98ti18kuk3vdje2qb.apps.googleusercontent.com';
  final _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    clientId: _webClientId,
    // serverClientId is not supported on web
    serverClientId: kIsWeb ? null : _webClientId,
  );

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _googleLoading = true);
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) {
        if (mounted) setState(() => _googleLoading = false);
        return;
      }
      final auth        = await account.authentication;
      final idToken     = auth.idToken;
      final accessToken = auth.accessToken;

      if (idToken == null && accessToken == null) {
        throw Exception('No token received from Google');
      }

      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
      ));
      final res = await dio.post(
        '${ApiConfig.nodeApi}/auth/google',
        data: {
          if (idToken != null)     'idToken': idToken,
          if (accessToken != null) 'accessToken': accessToken,
        },
      );

      if (res.statusCode == 200 && res.data['success'] == true) {
        final token = res.data['data']?['token'] as String? ?? '';
        final u     = res.data['data']?['user'] as Map? ?? {};
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token',  token);
        await prefs.setString('user_id',     u['id']         as String? ?? u['_id'] as String? ?? '');
        await prefs.setString('user_name',   u['name']       as String? ?? '');
        await prefs.setString('user_email',  u['email']      as String? ?? '');
        await prefs.setString('user_phone',  u['phone']      as String? ?? '');
        await prefs.setString('user_nid',    u['nationalId'] as String? ?? '');
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        }
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final String msg;
      if (e.type == DioExceptionType.connectionError || e.response == null) {
        msg = 'Cannot reach backend server. Is it running?';
      } else {
        msg = e.response?.data?['message'] as String? ?? 'Backend error ${e.response?.statusCode}: ${e.response?.data}';
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating, duration: const Duration(seconds: 8)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 8),
        ),
      );
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
      ));
      final res = await dio.post(
        '${ApiConfig.nodeApi}/auth/login',
        data: {
          'email':    _emailController.text.trim(),
          'password': _passwordController.text,
        },
      );
      if (res.statusCode == 200 && res.data['success'] == true) {
        final token    = res.data['data']?['token']                as String? ?? '';
        final u        = res.data['data']?['user'] as Map? ?? {};
        final prefs    = await SharedPreferences.getInstance();
        await prefs.setString('auth_token',  token);
        await prefs.setString('user_id',     u['id']         as String? ?? u['_id'] as String? ?? '');
        await prefs.setString('user_name',   u['name']       as String? ?? '');
        await prefs.setString('user_email',  u['email']      as String? ?? '');
        await prefs.setString('user_phone',  u['phone']      as String? ?? '');
        await prefs.setString('user_nid',    u['nationalId'] as String? ?? '');
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        }
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.type == DioExceptionType.connectionError
          ? S.current.cannotReachServer
          : (e.response?.data?['message'] as String? ?? S.current.loginFailed);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  Container(
                    height: 300,
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1E88E5), Color(0xFF1565C0)],
                      ),
                      borderRadius: BorderRadius.only(bottomLeft: Radius.circular(60)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 30),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 40),
                          const Icon(Icons.home_work_rounded, size: 60, color: Colors.white),
                          const SizedBox(height: 20),
                          Text(s.welcomeBack,
                              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text(s.signInSubtitle,
                              style: const TextStyle(fontSize: 16, color: Colors.white70)),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(30),
                    child: Column(
                      children: [
                        const SizedBox(height: 20),
                        _buildField(
                          label: s.emailAddress,
                          icon: Icons.email_outlined,
                          hint: 'example@mail.com',
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          action: TextInputAction.next,
                          validator: (v) {
                            if (v == null || v.isEmpty) return S.current.emailRequired;
                            if (!v.contains('@')) return S.current.emailInvalid;
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        _buildField(
                          label: s.password,
                          icon: Icons.lock_outline_rounded,
                          hint: '••••••••',
                          controller: _passwordController,
                          isPassword: true,
                          action: TextInputAction.done,
                          validator: (v) => (v == null || v.isEmpty) ? S.current.passwordRequired : null,
                        ),
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                            ),
                            child: Text(s.forgotPassword,
                                style: const TextStyle(color: Color(0xFF1E88E5), fontWeight: FontWeight.w600)),
                          ),
                        ),
                        const SizedBox(height: 30),
                        SizedBox(
                          width: double.infinity,
                          height: 55,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1E88E5),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                              elevation: 4,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 20, height: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : Text(s.loginBtn,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                          ),
                        ),
                        const SizedBox(height: 25),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(s.noAccount, style: TextStyle(color: Colors.grey.shade600)),
                            GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const RegisterScreen()),
                              ),
                              child: Text(s.createAccount,
                                  style: const TextStyle(color: Color(0xFF1E88E5), fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),

                        // ── OR divider ─────────────────────────────────────
                        Row(
                          children: [
                            Expanded(child: Divider(color: Colors.grey.shade300)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(s.orContinueWith,
                                  style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                            ),
                            Expanded(child: Divider(color: Colors.grey.shade300)),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // ── Google Sign-In button ──────────────────────────
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: OutlinedButton(
                            onPressed: (_isLoading || _googleLoading) ? null : _handleGoogleSignIn,
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.grey.shade300),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                              backgroundColor: Colors.white,
                            ),
                            child: _googleLoading
                                ? const SizedBox(width: 20, height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF1E88E5)))
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      // Google 'G' logo drawn with text (no asset needed)
                                      Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: Colors.grey.shade200),
                                        ),
                                        child: const Center(
                                          child: Text('G',
                                              style: TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF4285F4))),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Text(s.signInWithGoogle,
                                          style: TextStyle(
                                              color: Colors.grey.shade700,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14)),
                                    ],
                                  ),
                          ),
                        ),

                        const SizedBox(height: 28),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.verified_user, size: 16, color: Colors.grey.shade400),
                            const SizedBox(width: 8),
                            Text(s.encryptedConnection,
                                style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Positioned(top: 50, right: 16, child: LangToggleButton()),
        ],
      ),
    );
  }

  Widget _buildField({
    required String label,
    required IconData icon,
    required String hint,
    required TextEditingController controller,
    bool isPassword = false,
    TextInputAction? action,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF263238))),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: isPassword ? _isObscured : false,
          textInputAction: action,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            prefixIcon: Icon(icon, color: const Color(0xFF1E88E5), size: 22),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(_isObscured ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey, size: 20),
                    onPressed: () => setState(() => _isObscured = !_isObscured),
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            errorStyle: const TextStyle(color: Colors.redAccent),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(color: Colors.grey.shade200)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: const BorderSide(color: Color(0xFF1E88E5), width: 2)),
            errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: const BorderSide(color: Colors.redAccent)),
            focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: const BorderSide(color: Colors.redAccent, width: 2)),
          ),
        ),
      ],
    );
  }
}
