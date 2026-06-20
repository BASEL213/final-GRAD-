import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/lang.dart';
import 'login_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  static const Color _blue = Color(0xFF1E88E5);
  static const Color _dark = Color(0xFF263238);

  // Step: 0 = email, 1 = OTP, 2 = new password
  int _step = 0;
  bool _isLoading = false;

  final _emailController = TextEditingController();
  final _otpController   = TextEditingController();
  final _pass1Controller = TextEditingController();
  final _pass2Controller = TextEditingController();
  bool _obscure1 = true;
  bool _obscure2 = true;

  String _submittedEmail = '';

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _pass1Controller.dispose();
    _pass2Controller.dispose();
    super.dispose();
  }

  // ── Step 0: request OTP ────────────────────────────────────────────────────

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      _snack(S.current.emailInvalid, error: true);
      return;
    }
    setState(() => _isLoading = true);
    try {
      await Dio().post(
        '${ApiConfig.nodeApi}/auth/forgot-password',
        data: {'email': email},
      );
      _submittedEmail = email;
      if (mounted) setState(() { _step = 1; _isLoading = false; });
    } on DioException catch (e) {
      _snack(_dioMsg(e), error: true);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Step 1: verify OTP (move to step 2) ───────────────────────────────────

  void _confirmOtp() {
    final otp = _otpController.text.trim();
    if (otp.isEmpty) { _snack(S.current.otpRequired, error: true); return; }
    if (otp.length != 6) { _snack(S.current.otpMust6, error: true); return; }
    setState(() => _step = 2);
  }

  // ── Step 2: reset password ─────────────────────────────────────────────────

  Future<void> _resetPassword() async {
    final pass1 = _pass1Controller.text;
    final pass2 = _pass2Controller.text;
    if (pass1.isEmpty || pass1.length < 6) {
      _snack('كلمة المرور يجب أن تكون 6 أحرف على الأقل', error: true);
      return;
    }
    if (pass1 != pass2) {
      _snack(S.current.passwordsNoMatch, error: true);
      return;
    }
    setState(() => _isLoading = true);
    try {
      final res = await Dio().post(
        '${ApiConfig.nodeApi}/auth/reset-password',
        data: {
          'email':    _submittedEmail,
          'otp':     _otpController.text.trim(),
          'password': pass1,
        },
      );
      if (res.data['success'] == true) {
        _snack(S.current.passwordResetSuccess);
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (_) => false,
          );
        }
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? S.current.invalidOtp;
      _snack(msg, error: true);
      // If OTP is invalid, go back to OTP step
      if (mounted && (e.response?.statusCode == 400)) {
        setState(() { _step = 1; _isLoading = false; });
        return;
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _dioMsg(DioException e) =>
      e.type == DioExceptionType.connectionError
          ? S.current.cannotReachServerShort
          : (e.response?.data?['message'] as String? ?? S.current.cannotReachServerShort);

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? Colors.redAccent : Colors.green,
      behavior: SnackBarBehavior.floating,
    ));
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: _dark, size: 20),
          onPressed: () {
            if (_step > 0) {
              setState(() => _step--);
            } else {
              Navigator.pop(context);
            }
          },
        ),
        actions: const [LangToggleButton()],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(28, 0, 28, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header icon
            Center(
              child: Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: _blue.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_reset_rounded, size: 64, color: _blue),
              ),
            ),
            const SizedBox(height: 24),

            // Step indicator
            _StepIndicator(current: _step),
            const SizedBox(height: 28),

            // Step content
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 350),
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.08, 0),
                    end: Offset.zero,
                  ).animate(anim),
                  child: child,
                ),
              ),
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: _step == 0
                    ? _buildEmailStep(s)
                    : _step == 1
                        ? _buildOtpStep(s)
                        : _buildPasswordStep(s),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 0 widget ──────────────────────────────────────────────────────────

  Widget _buildEmailStep(S s) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(s.step1EnterEmail,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _dark)),
        const SizedBox(height: 8),
        Text(s.howReceiveCode,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
        const SizedBox(height: 28),
        _buildField(
          controller: _emailController,
          label: s.emailAddress,
          hint: 'example@gmail.com',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
          action: TextInputAction.done,
          onSubmitted: (_) => _sendOtp(),
        ),
        const SizedBox(height: 32),
        _buildButton(
          label: s.sendOtp,
          onPressed: _isLoading ? null : _sendOtp,
        ),
      ],
    );
  }

  // ── Step 1 widget ──────────────────────────────────────────────────────────

  Widget _buildOtpStep(S s) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(s.step2EnterOtp,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _dark)),
        const SizedBox(height: 8),
        RichText(
          text: TextSpan(
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            children: [
              TextSpan(text: '${s.otpSentTo} '),
              TextSpan(
                text: _submittedEmail,
                style: const TextStyle(fontWeight: FontWeight.bold, color: _blue),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),

        // 6-digit OTP field
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 12, color: _dark),
          decoration: InputDecoration(
            counterText: '',
            hintText: '------',
            hintStyle: TextStyle(color: Colors.grey.shade300, fontSize: 28, letterSpacing: 12),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(color: _blue, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 18),
          ),
        ),
        const SizedBox(height: 12),

        // Resend OTP
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(s.resetSent, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            TextButton(
              onPressed: _isLoading ? null : () {
                setState(() { _step = 0; _otpController.clear(); });
              },
              child: Text(s.resendOtp,
                  style: const TextStyle(color: _blue, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildButton(label: s.verifyOtp, onPressed: _confirmOtp),
      ],
    );
  }

  // ── Step 2 widget ──────────────────────────────────────────────────────────

  Widget _buildPasswordStep(S s) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(s.step3NewPassword,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _dark)),
        const SizedBox(height: 8),
        Text('اختر كلمة مرور جديدة قوية لحسابك',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
        const SizedBox(height: 28),
        _buildField(
          controller: _pass1Controller,
          label: s.newPassword,
          hint: '••••••••',
          icon: Icons.lock_outline_rounded,
          isPassword: true,
          obscure: _obscure1,
          toggleObscure: () => setState(() => _obscure1 = !_obscure1),
          action: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        _buildField(
          controller: _pass2Controller,
          label: s.confirmNewPassword,
          hint: '••••••••',
          icon: Icons.lock_outline_rounded,
          isPassword: true,
          obscure: _obscure2,
          toggleObscure: () => setState(() => _obscure2 = !_obscure2),
          action: TextInputAction.done,
          onSubmitted: (_) => _resetPassword(),
        ),
        const SizedBox(height: 32),
        _buildButton(
          label: s.resetPasswordBtn,
          onPressed: _isLoading ? null : _resetPassword,
        ),
      ],
    );
  }

  // ── Shared widgets ─────────────────────────────────────────────────────────

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool obscure = false,
    VoidCallback? toggleObscure,
    TextInputAction? action,
    TextInputType? keyboardType,
    ValueChanged<String>? onSubmitted,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _dark)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword ? obscure : false,
          keyboardType: keyboardType,
          textInputAction: action,
          onSubmitted: onSubmitted,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            prefixIcon: Icon(icon, color: _blue, size: 22),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(obscure ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey, size: 20),
                    onPressed: toggleObscure,
                  )
                : null,
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(color: Colors.grey.shade200)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: const BorderSide(color: _blue, width: 2)),
          ),
        ),
      ],
    );
  }

  Widget _buildButton({required String label, VoidCallback? onPressed}) {
    return SizedBox(
      height: 55,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _blue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          elevation: 4,
        ),
        child: _isLoading
            ? const SizedBox(width: 22, height: 22,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(label,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 1)),
      ),
    );
  }
}

// ── Step indicator ─────────────────────────────────────────────────────────────

class _StepIndicator extends StatelessWidget {
  final int current;
  const _StepIndicator({required this.current});

  @override
  Widget build(BuildContext context) {
    final labels = ['البريد الإلكتروني', 'كود التحقق', 'كلمة المرور'];
    return Row(
      children: List.generate(3, (i) {
        final done = i < current;
        final active = i == current;
        return Expanded(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: done || active ? const Color(0xFF1E88E5) : Colors.grey.shade200,
                      ),
                      child: Center(
                        child: done
                            ? const Icon(Icons.check, color: Colors.white, size: 18)
                            : Text('${i + 1}',
                                style: TextStyle(
                                    color: active ? Colors.white : Colors.grey.shade500,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14)),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(labels[i],
                        style: TextStyle(
                            fontSize: 10,
                            color: active ? const Color(0xFF1E88E5) : Colors.grey.shade400,
                            fontWeight: active ? FontWeight.bold : FontWeight.normal)),
                  ],
                ),
              ),
              if (i < 2)
                Expanded(
                  child: Container(
                    height: 2,
                    color: i < current ? const Color(0xFF1E88E5) : Colors.grey.shade200,
                    margin: const EdgeInsets.only(bottom: 20),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}
