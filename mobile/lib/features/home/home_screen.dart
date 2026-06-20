import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/lang.dart';
import 'package:findoor_app2/core/page_tracker.dart';
import 'application_page.dart';
import 'profile_screen.dart';
import 'search_screen.dart';
import 'status_screen.dart';
import 'wallet_screen.dart';
import 'projects_screen.dart';
import 'property_details_screen.dart';
import 'chatbot_screen.dart';
import 'documents_vault_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with PageTracker<HomeScreen> {
  @override
  String get trackedPage => 'home';
  // Professional color palette
  static const Color primaryBlue = Color(0xFF1E88E5);

  String _userName = '';
  List<Map<String, dynamic>> _featuredProjects = [];
  bool _loadingFeatured = false;
  bool _errorFeatured = false;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
    _fetchFeaturedProjects();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _userName = prefs.getString('user_name') ?? '';
      });
    }
  }

  Future<void> _fetchFeaturedProjects() async {
    setState(() { _loadingFeatured = true; _errorFeatured = false; });
    try {
      final res = await Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      )).get('${ApiConfig.nodeApi}/projects',
          queryParameters: {'limit': 5},
          options: await ApiConfig.authOptions);
      final list = res.data is List
          ? res.data as List
          : (res.data['data'] as List? ?? []);
      if (mounted) {
        setState(() {
          _featuredProjects = list
              .map((p) => Map<String, dynamic>.from(p as Map))
              .toList();
        });
      }
    } catch (_) {
      if (mounted) setState(() => _errorFeatured = true);
    } finally {
      if (mounted) setState(() => _loadingFeatured = false);
    }
  }
  static const Color darkBlue = Color(0xFF1565C0);
  static const Color premiumBackground = Color(0xFFF8FAFC);
  static const Color darkText = Color(0xFF263238);


  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Scaffold(
      backgroundColor: premiumBackground,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 90), // Offset to stay above the floating nav bar
        child: FloatingActionButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ChatbotPage()),
            );
          },
          backgroundColor: darkText,
          elevation: 4,
          shape: const CircleBorder(),
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [primaryBlue, Colors.purple.shade400],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
          ),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 60),
                _buildHeader(),
                const SizedBox(height: 24),
                _buildQuickServices(),
                const SizedBox(height: 32),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    s.featuredProperties,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: darkText,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _buildPropertyCarousel(),
                const SizedBox(height: 120),
              ],
            ),
          ),
          _buildFloatingNavBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_userName.isNotEmpty ? S.current.hi(_userName) : S.current.hiThere, style: const TextStyle(color: Colors.grey, fontSize: 16)),
              Text(S.current.goodMorning,
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: darkText, letterSpacing: -0.5)),
            ],
          ),
          Row(
            children: [
              const LangToggleButton(),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfilePage())),
                child: Tooltip(
                  message: S.current.viewProfile,
                  child: Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: primaryBlue.withValues(alpha: 0.2), width: 2),
                        ),
                        child: const CircleAvatar(
                          radius: 25,
                          backgroundColor: primaryBlue,
                          child: Icon(Icons.person, color: Colors.white, size: 30),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickServices() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Tooltip(
                  message: S.current.startApplicationTooltip,
                  child: InkWell(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const ApplicationPage()))
                          .then((_) => _loadPrefs());
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      height: 180,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [primaryBlue, darkBlue], begin: Alignment.topLeft, end: Alignment.bottomRight),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(color: primaryBlue.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 5)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Icon(Icons.add_home_work_outlined, color: Colors.white, size: 40),
                          const Spacer(),
                          Text(S.current.applyNow, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                          Text(S.current.startNewApplication, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  children: [
                    _buildSmallStatusCard(S.current.myStatus, Icons.auto_graph, Colors.orange, S.current.trackStatus, () async {
                      final prefs = await SharedPreferences.getInstance();
                      String code = prefs.getString('tracking_code') ?? '';

                      if (code.isEmpty) {
                        final email = prefs.getString('user_email') ?? '';
                        final nid   = prefs.getString('user_nid')   ?? '';
                        final query = email.isNotEmpty ? email : nid;
                        if (query.isNotEmpty) {
                          try {
                            final res = await Dio(BaseOptions(
                              connectTimeout: const Duration(seconds: 10),
                              receiveTimeout: const Duration(seconds: 10),
                            )).get(
                              '${ApiConfig.nodeApi}/applications',
                              queryParameters: {'search': query},
                              options: await ApiConfig.authOptions,
                            );
                            final list = (res.data['data'] as List? ?? []);
                            if (list.isNotEmpty) {
                              final found = list.first as Map<String, dynamic>;
                              code = (found['_id'] ?? '').toString();
                              if (code.isNotEmpty) {
                                await prefs.setString('tracking_code', code);
                              }
                            }
                          } catch (_) {}
                        }
                      }

                      if (!mounted) return;
                      if (code.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(S.current.noApplicationFound), behavior: SnackBarBehavior.floating),
                        );
                        return;
                      }
                      Navigator.push(context, MaterialPageRoute(builder: (_) => StatusPage(trackingCode: code)));
                    }),
                    const SizedBox(height: 16),
                    _buildSmallStatusCard(S.current.eWallet, Icons.account_balance_wallet, Colors.green, S.current.viewBalance, () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const WalletPage()));
                    }),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DocumentsVaultScreen())),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade100),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 5))],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(12)),
                    child: Icon(Icons.folder_outlined, color: Colors.indigo.shade600, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(S.current.myDocuments, style: const TextStyle(fontWeight: FontWeight.bold, color: darkText, fontSize: 15)),
                        Text(S.current.viewManageFiles, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey.shade400),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmallStatusCard(String title, IconData icon, Color accentColor, String tooltip, VoidCallback onTap) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 5)),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: accentColor),
              const SizedBox(width: 12),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: darkText)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPropertyCarousel() {
    if (_loadingFeatured) {
      return const SizedBox(
        height: 380,
        child: Center(child: CircularProgressIndicator(color: primaryBlue)),
      );
    }
    if (_errorFeatured) {
      return SizedBox(
        height: 200,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.wifi_off, size: 48, color: Colors.grey.shade300),
              const SizedBox(height: 12),
              Text(S.current.connectionNetworkError,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: _fetchFeaturedProjects,
                icon: const Icon(Icons.refresh, size: 16, color: primaryBlue),
                label: Text(S.current.retry,
                    style: const TextStyle(color: primaryBlue, fontSize: 13)),
              ),
            ],
          ),
        ),
      );
    }
    if (_featuredProjects.isEmpty) {
      return SizedBox(
        height: 200,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.apartment_outlined, size: 48, color: Colors.grey.shade300),
              const SizedBox(height: 12),
              Text(S.current.noProjectsAvailable,
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
            ],
          ),
        ),
      );
    }
    return SizedBox(
      height: 380,
      child: PageView.builder(
        controller: PageController(viewportFraction: 0.9),
        itemCount: _featuredProjects.length,
        itemBuilder: (context, index) {
          final p = _featuredProjects[index];
          final title = (p['name'] ?? p['title'] ?? 'Project').toString();
          final location = p['location'] is Map
              ? ((p['location'] as Map)['city'] ?? '').toString()
              : (p['location'] ?? p['governorate'] ?? 'Egypt').toString();
          final price = (p['priceRange'] ?? (p['price'] != null ? 'EGP ${p['price']}' : 'On request')).toString();
          final imageUrl = ApiConfig.fixImageUrl((p['imageUrl'] ?? p['image'] ?? '').toString());
          return InkWell(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PropertyDetailsPage(property: p),
              ),
            ),
            borderRadius: BorderRadius.circular(32),
            child: Container(
              margin: const EdgeInsets.only(right: 20, bottom: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 10)),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      children: [
                        imageUrl.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: imageUrl,
                                height: 220,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => _projectImagePlaceholder(),
                                errorWidget: (_, __, ___) => _projectImagePlaceholder())
                            : _projectImagePlaceholder(),
                        Positioned(
                          top: 16,
                          left: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                                color: primaryBlue,
                                borderRadius: BorderRadius.circular(20)),
                            child: Text(S.current.socialHousing,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2)),
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: darkText)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.location_on,
                                  size: 13, color: Colors.grey),
                              const SizedBox(width: 3),
                              Expanded(
                                child: Text(location,
                                    style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontSize: 12),
                                    overflow: TextOverflow.ellipsis),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _buildPropertyDetailChip(price),
                              const SizedBox(width: 8),
                              if ((p['availableUnits'] as int? ?? 0) > 0)
                                _buildPropertyDetailChip(
                                    S.current.unitsLeft(p['availableUnits'] as int)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _projectImagePlaceholder() => Container(
        height: 220,
        width: double.infinity,
        color: Colors.grey.shade100,
        child: Icon(Icons.apartment_rounded,
            size: 60, color: Colors.grey.shade300),
      );

  Widget _buildPropertyDetailChip(String detail) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
      child: Text(detail, style: const TextStyle(color: primaryBlue, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildFloatingNavBar() {
    return Positioned(
      bottom: 40,
      left: 30,
      right: 30,
      child: Container(
        height: 70,
        decoration: BoxDecoration(
          color: darkText,
          borderRadius: BorderRadius.circular(35),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10)),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _navIcon(Icons.grid_view, S.current.homeTab, true, () {}),
            _navIcon(Icons.business, S.current.projectsTab, false, () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const ProjectsPage()));
            }),
            _navIcon(Icons.search, S.current.searchTab, false, () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const SearchPage()));
            }),
            _navIcon(Icons.person_outline, S.current.profileTab, false, () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfilePage()));
            }),
          ],
        ),
      ),
    );
  }

  Widget _navIcon(IconData icon, String label, bool isActive, VoidCallback onTap) {
    return Tooltip(
      message: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(35),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Icon(icon, color: isActive ? primaryBlue : Colors.white60, size: 28),
        ),
      ),
    );
  }
}