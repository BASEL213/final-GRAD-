import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/page_tracker.dart';
import 'package:findoor_app2/features/auth/login_screen.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with PageTracker<ProfilePage> {
  @override
  String get trackedPage => 'profile';

  static const Color primaryBlue       = Color(0xFF1E88E5);
  static const Color darkText          = Color(0xFF263238);
  static const Color premiumBackground = Color(0xFFF8FAFC);

  String _name  = '';
  String _email = '';
  String _phone = '';
  String _nid   = '';
  bool   _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _name  = prefs.getString('user_name')  ?? '';
        _email = prefs.getString('user_email') ?? '';
        _phone = prefs.getString('user_phone') ?? '';
        _nid   = prefs.getString('user_nid')   ?? '';
        _notificationsEnabled =
            prefs.getBool('notifications_enabled') ?? true;
      });
    }
  }

  // ── Logout ──────────────────────────────────────────────────────────────

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Logout',
            style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Logout',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  // ── Edit profile ─────────────────────────────────────────────────────────

  void _showEditDialog() {
    final messenger  = ScaffoldMessenger.of(context);
    final nameCtrl   = TextEditingController(text: _name);
    final phoneCtrl  = TextEditingController(text: _phone);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Edit Profile',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: darkText)),
              const SizedBox(height: 20),
              _editField('Full Name', nameCtrl, Icons.person_outline),
              const SizedBox(height: 16),
              _editField('Phone Number', phoneCtrl,
                  Icons.phone_android_rounded,
                  type: TextInputType.phone),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () async {
                    final nav = Navigator.of(ctx);
                    final prefs =
                        await SharedPreferences.getInstance();
                    await prefs.setString(
                        'user_name', nameCtrl.text.trim());
                    await prefs.setString(
                        'user_phone', phoneCtrl.text.trim());
                    if (mounted) {
                      setState(() {
                        _name  = nameCtrl.text.trim();
                        _phone = phoneCtrl.text.trim();
                      });
                      nav.pop();
                      messenger.showSnackBar(const SnackBar(
                          content: Text('Profile updated'),
                          behavior: SnackBarBehavior.floating));
                    }
                    try {
                      final prefs2 =
                          await SharedPreferences.getInstance();
                      final userId =
                          prefs2.getString('user_id') ?? '';
                      if (userId.isNotEmpty) {
                        await Dio().put(
                          '${ApiConfig.nodeApi}/users/$userId',
                          data: {
                            'name':  nameCtrl.text.trim(),
                            'phone': phoneCtrl.text.trim(),
                          },
                          options: await ApiConfig.authOptions,
                        );
                      }
                    } catch (_) {}
                  },
                  child: const Text('Save Changes',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  // ── Account settings actions ─────────────────────────────────────────────

  void _showChangePasswordSheet() {
    final currentCtrl = TextEditingController();
    final newCtrl     = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool obscureCurrent = true;
    bool obscureNew     = true;
    bool obscureConfirm = true;
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius:
                  BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Change Password',
                    style: TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                _passwordField('Current Password', currentCtrl,
                    obscureCurrent,
                    () => setSheetState(
                        () => obscureCurrent = !obscureCurrent)),
                const SizedBox(height: 14),
                _passwordField('New Password', newCtrl, obscureNew,
                    () => setSheetState(
                        () => obscureNew = !obscureNew)),
                const SizedBox(height: 14),
                _passwordField('Confirm New Password', confirmCtrl,
                    obscureConfirm,
                    () => setSheetState(
                        () => obscureConfirm = !obscureConfirm)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: saving
                        ? null
                        : () async {
                            if (currentCtrl.text.trim().isEmpty ||
                                newCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(const SnackBar(
                                content: Text(
                                    'Please fill in all fields.'),
                                backgroundColor: Colors.redAccent,
                                behavior: SnackBarBehavior.floating,
                              ));
                              return;
                            }
                            if (newCtrl.text != confirmCtrl.text) {
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(const SnackBar(
                                content: Text(
                                    'New passwords do not match.'),
                                backgroundColor: Colors.redAccent,
                                behavior: SnackBarBehavior.floating,
                              ));
                              return;
                            }
                            if (newCtrl.text.length < 6) {
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(const SnackBar(
                                content: Text(
                                    'Password must be at least 6 characters.'),
                                backgroundColor: Colors.redAccent,
                                behavior: SnackBarBehavior.floating,
                              ));
                              return;
                            }
                            setSheetState(() => saving = true);
                            try {
                              final prefs = await SharedPreferences
                                  .getInstance();
                              final token =
                                  prefs.getString('auth_token') ?? '';
                              await Dio().put(
                                '${ApiConfig.nodeApi}/auth/change-password',
                                data: {
                                  'currentPassword':
                                      currentCtrl.text.trim(),
                                  'newPassword': newCtrl.text.trim(),
                                },
                                options: Options(headers: {
                                  'Authorization': 'Bearer $token'
                                }),
                              );
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (mounted) {
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(const SnackBar(
                                  content: Text(
                                      'Password changed successfully.'),
                                  backgroundColor: Colors.green,
                                  behavior: SnackBarBehavior.floating,
                                ));
                              }
                            } catch (e) {
                              setSheetState(() => saving = false);
                              final msg = (e is DioException)
                                  ? (e.response?.data?['message']
                                          as String? ??
                                      'Incorrect current password.')
                                  : 'Could not change password. Try again.';
                              if (mounted) {
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(SnackBar(
                                  content: Text(msg),
                                  backgroundColor: Colors.redAccent,
                                  behavior: SnackBarBehavior.floating,
                                ));
                              }
                            }
                          },
                    child: saving
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('Update Password',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showNotificationsSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Notifications',
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: premiumBackground,
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.notifications_none,
                          color: primaryBlue, size: 22),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text('Push Notifications',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15)),
                          Text('Application status updates',
                              style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12)),
                        ],
                      ),
                    ),
                    Switch(
                      value: _notificationsEnabled,
                      activeThumbColor: primaryBlue,
                      onChanged: (val) async {
                        final prefs =
                            await SharedPreferences.getInstance();
                        await prefs.setBool(
                            'notifications_enabled', val);
                        setSheetState(
                            () => _notificationsEnabled = val);
                        if (mounted) {
                          setState(
                              () => _notificationsEnabled = val);
                        }
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageSheet() {
    const languages = [
      ('English', 'en', true),
      ('العربية', 'ar', false),
      ('Français', 'fr', false),
    ];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Language',
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ...languages.map((lang) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: lang.$3
                        ? const Color(0xFFE3F2FD)
                        : premiumBackground,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: lang.$3
                          ? primaryBlue.withValues(alpha: 0.4)
                          : Colors.grey.shade200,
                    ),
                  ),
                  child: ListTile(
                    leading: Text(
                      lang.$1,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: lang.$3
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: lang.$3
                            ? primaryBlue
                            : (lang.$3
                                ? darkText
                                : Colors.grey),
                      ),
                    ),
                    trailing: lang.$3
                        ? const Icon(Icons.check_circle,
                            color: primaryBlue)
                        : Text('Coming soon',
                            style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey.shade400)),
                    onTap: lang.$3
                        ? () => Navigator.pop(ctx)
                        : null,
                  ),
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  Widget _passwordField(
    String label,
    TextEditingController ctrl,
    bool obscure,
    VoidCallback toggleObscure,
  ) =>
      TextField(
        controller: ctrl,
        obscureText: obscure,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon:
              const Icon(Icons.lock_outline, size: 20),
          suffixIcon: IconButton(
            icon: Icon(
                obscure
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                size: 20,
                color: Colors.grey),
            onPressed: toggleObscure,
          ),
          filled: true,
          fillColor: premiumBackground,
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  BorderSide(color: Colors.grey.shade200)),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                  color: primaryBlue, width: 1.5)),
        ),
      );

  Widget _editField(
    String label,
    TextEditingController ctrl,
    IconData icon, {
    TextInputType type = TextInputType.text,
  }) =>
      TextFormField(
        controller: ctrl,
        keyboardType: type,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: primaryBlue, size: 20),
          filled: true,
          fillColor: premiumBackground,
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  BorderSide(color: Colors.grey.shade200)),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                  color: primaryBlue, width: 1.5)),
        ),
      );

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: premiumBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: darkText, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('My Profile',
            style: TextStyle(
                color: darkText,
                fontWeight: FontWeight.bold,
                fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined,
                color: primaryBlue),
            onPressed: _showEditDialog,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            _buildProfileAvatar(),
            const SizedBox(height: 16),
            Text(
              _name.isNotEmpty ? _name : 'User',
              style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: darkText),
            ),
            const Text('Findoor Member',
                style:
                    TextStyle(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 32),

            // ── Personal Information ──────────────────────────
            _buildSectionHeader('Personal Information'),
            _buildProfileCard([
              _buildProfileItem(
                  Icons.email_outlined,
                  'Email',
                  _email.isNotEmpty ? _email : '—'),
              _buildDivider(),
              _buildProfileItem(
                  Icons.phone_android_outlined,
                  'Phone',
                  _phone.isNotEmpty ? _phone : '—'),
              _buildDivider(),
              _buildProfileItem(
                  Icons.badge_outlined,
                  'National ID',
                  _nid.isNotEmpty ? _maskNid(_nid) : '—'),
            ]),
            const SizedBox(height: 24),

            // ── Account Settings ──────────────────────────────
            _buildSectionHeader('Account Settings'),
            _buildProfileCard([
              _buildTappableProfileItem(
                icon: Icons.shield_outlined,
                label: 'Security',
                value: 'Change password',
                onTap: _showChangePasswordSheet,
              ),
              _buildDivider(),
              _buildTappableProfileItem(
                icon: Icons.notifications_none_outlined,
                label: 'Notifications',
                value: _notificationsEnabled ? 'On' : 'Off',
                onTap: _showNotificationsSheet,
              ),
              _buildDivider(),
              _buildTappableProfileItem(
                icon: Icons.language_outlined,
                label: 'Language',
                value: 'English',
                onTap: _showLanguageSheet,
              ),
            ]),
            const SizedBox(height: 32),

            // ── Logout ────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: _handleLogout,
                icon: const Icon(Icons.logout_rounded,
                    color: Colors.redAccent),
                label: const Text('Logout from Account',
                    style: TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold)),
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.redAccent
                      .withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(15)),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ── Widgets ──────────────────────────────────────────────────────────────

  String _maskNid(String nid) {
    if (nid.length < 6) return nid;
    return '${nid.substring(0, 3)}${'*' * (nid.length - 6)}${nid.substring(nid.length - 3)}';
  }

  Widget _buildProfileAvatar() => GestureDetector(
        onTap: _showEditDialog,
        child: Stack(
          alignment: Alignment.bottomRight,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: primaryBlue.withValues(alpha: 0.2),
                    width: 2),
              ),
              child: CircleAvatar(
                radius: 60,
                backgroundColor: primaryBlue,
                child: Text(
                  _name.isNotEmpty
                      ? _name[0].toUpperCase()
                      : 'U',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                  color: primaryBlue, shape: BoxShape.circle),
              child: const Icon(Icons.camera_alt,
                  color: Colors.white, size: 20),
            ),
          ],
        ),
      );

  Widget _buildSectionHeader(String title) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 12),
        child: Align(
          alignment: Alignment.centerLeft,
          child: Text(title,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: darkText)),
        ),
      );

  Widget _buildProfileCard(List<Widget> children) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 20,
                offset: const Offset(0, 10)),
          ],
        ),
        child: Column(children: children),
      );

  Widget _buildProfileItem(
          IconData icon, String label, String value) =>
      Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                  color: premiumBackground,
                  borderRadius: BorderRadius.circular(12)),
              child:
                  Icon(icon, color: primaryBlue, size: 22),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 12, color: Colors.grey)),
                Text(value,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: darkText)),
              ],
            ),
          ],
        ),
      );

  Widget _buildTappableProfileItem({
    required IconData icon,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) =>
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: premiumBackground,
                    borderRadius: BorderRadius.circular(12)),
                child:
                    Icon(icon, color: primaryBlue, size: 22),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          fontSize: 12, color: Colors.grey)),
                  Text(value,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: darkText)),
                ],
              ),
              const Spacer(),
              const Icon(Icons.arrow_forward_ios,
                  color: Colors.grey, size: 14),
            ],
          ),
        ),
      );

  Widget _buildDivider() => Divider(
      height: 1,
      indent: 70,
      endIndent: 16,
      color: Colors.grey.shade100);
}
