import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:developer' as developer;
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/lang.dart';
import 'package:findoor_app2/core/page_tracker.dart';
import 'property_details_screen.dart';

class ProjectsPage extends StatefulWidget {
  const ProjectsPage({super.key});

  @override
  State<ProjectsPage> createState() => _ProjectsPageState();
}

class _ProjectsPageState extends State<ProjectsPage>
    with PageTracker<ProjectsPage> {
  @override
  String get trackedPage => 'projects';

  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText = Color(0xFF263238);

  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));
  List _projects = [];
  bool _isLoading = true;
  String _errorMessage = '';
  String _search = '';

  @override
  void initState() {
    super.initState();
    _fetchProjects();
  }

  Future<void> _fetchProjects() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = '';
      });
      final response = await _dio.get(
        '${ApiConfig.nodeApi}/projects',
        queryParameters: {'limit': 100},
        options: await ApiConfig.authOptions,
      );
      if (response.statusCode == 200) {
        setState(() {
          _projects = response.data is List
              ? response.data
              : (response.data['data'] ?? []);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = S.current.connectionNetworkError;
      });
      developer.log('Error fetching projects', error: e);
    }
  }

  List get _filtered {
    if (_search.trim().isEmpty) return _projects;
    final q = _search.trim().toLowerCase();
    return _projects.where((p) {
      final name = (p['name'] ?? '').toString().toLowerCase();
      final loc = (p['location'] is String
              ? p['location']
              : (p['location'] is Map ? p['location']['city'] : ''))
          .toString()
          .toLowerCase();
      return name.contains(q) || loc.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: darkText, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          s.majorProjects,
          style: const TextStyle(
              color: darkText, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          const LangToggleButton(),
          IconButton(
            onPressed: _fetchProjects,
            icon: const Icon(Icons.refresh, color: primaryBlue),
            tooltip: s.refresh,
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search bar ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: s.searchProjects,
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon:
                    Icon(Icons.search, color: Colors.grey.shade400, size: 20),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide:
                      const BorderSide(color: primaryBlue, width: 1.5),
                ),
              ),
            ),
          ),

          // ── List / states ───────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: primaryBlue))
                : _errorMessage.isNotEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.wifi_off,
                                  size: 56, color: Colors.grey.shade300),
                              const SizedBox(height: 16),
                              Text(_errorMessage,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 14)),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: _fetchProjects,
                                style: ElevatedButton.styleFrom(
                                    backgroundColor: primaryBlue,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12))),
                                icon: const Icon(Icons.refresh,
                                    color: Colors.white, size: 18),
                                label: Text(s.retry,
                                    style: const TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.search_off,
                                    size: 56, color: Colors.grey.shade300),
                                const SizedBox(height: 12),
                                Text(
                                  _search.isEmpty
                                      ? s.noProjectsAvailable
                                      : s.noProjectsMatch(_search),
                                  style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 14),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            color: primaryBlue,
                            onRefresh: _fetchProjects,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                              itemCount: _filtered.length,
                              itemBuilder: (context, index) {
                                final project = _filtered[index];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 20),
                                  child: _ProjectCard(project: project),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

// ── Tappable project card ──────────────────────────────────────────────────

class _ProjectCard extends StatefulWidget {
  final dynamic project;
  const _ProjectCard({required this.project});

  @override
  State<_ProjectCard> createState() => _ProjectCardState();
}

class _ProjectCardState extends State<_ProjectCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  Timer? _imgTimer;
  int _imgIndex = 0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.0,
      upperBound: 1.0,
    );
    _scale = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
    _startTimer();
  }

  List<String> get _images {
    final p = widget.project;
    final raw = p['images'];
    if (raw is List && raw.isNotEmpty) {
      return raw
          .map((e) => ApiConfig.fixImageUrl(e.toString()))
          .where((u) => u.isNotEmpty)
          .toList();
    }
    final single = ApiConfig.fixImageUrl(
        (p['imageUrl'] ?? p['image'] ?? '').toString());
    return single.isNotEmpty ? [single] : [];
  }

  void _startTimer() {
    if (_images.length > 1) {
      _imgTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        if (!mounted) return;
        setState(() => _imgIndex = (_imgIndex + 1) % _images.length);
      });
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _imgTimer?.cancel();
    super.dispose();
  }

  void _onTapDown(_) => _ctrl.forward();
  void _onTapUp(_) => _ctrl.reverse();
  void _onTapCancel() => _ctrl.reverse();

  void _openDetails(BuildContext context) {
    final p = widget.project as Map;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PropertyDetailsPage(
          property: Map<String, dynamic>.from(p),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.project;
    final s = S.of(context);
    final images = _images;

    String location = '';
    if (p['location'] is String) {
      location = p['location'] as String;
    } else if (p['location'] is Map) {
      location = (p['location']['city'] ?? 'Unknown').toString();
    }

    final int available = (p['availableUnits'] as int?) ?? 0;
    final int total = (p['totalUnits'] as int?) ?? 0;
    final String price = (p['priceRange'] ?? 'N/A').toString();
    final String status = (p['status'] ?? 'active').toString();
    final bool soldOut = available == 0 && total > 0;

    final String unitsLabel = soldOut
        ? s.soldOut
        : (total > 0
            ? s.unitsOfTotal(available, total)
            : s.unitsLeft(available));

    String badgeText;
    Color badgeColor;
    switch (status) {
      case 'active':
        badgeText = s.statusActive;
        badgeColor = Colors.green;
        break;
      case 'planning':
        badgeText = s.statusPlanning;
        badgeColor = Colors.orange;
        break;
      case 'completed':
        badgeText = s.statusCompleted;
        badgeColor = Colors.blue;
        break;
      default:
        badgeText = status.toUpperCase();
        badgeColor = Colors.grey;
    }

    if (soldOut) {
      badgeText = s.soldOut.toUpperCase();
      badgeColor = Colors.red;
    }

    return GestureDetector(
      onTap: () => _openDetails(context),
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedBuilder(
        animation: _scale,
        builder: (_, child) =>
            Transform.scale(scale: _scale.value, child: child),
        child: Container(
          height: 260,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // ── crossfade background image ──────────────────
                images.isEmpty
                    ? Container(color: Colors.grey.shade200)
                    : AnimatedSwitcher(
                        duration: const Duration(milliseconds: 900),
                        transitionBuilder: (child, anim) =>
                            FadeTransition(opacity: anim, child: child),
                        child: CachedNetworkImage(
                          imageUrl: images[_imgIndex],
                          key: ValueKey('${p['_id'] ?? ''}_$_imgIndex'),
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          placeholder: (_, __) => Container(color: Colors.grey.shade200),
                          errorWidget: (_, __, ___) => Container(color: Colors.grey.shade200),
                        ),
                      ),

                // ── gradient overlay ───────────────────────────
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.88),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.55],
                    ),
                  ),
                ),

                // ── content ────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // dot indicators above the text
                      if (images.length > 1) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            images.length,
                            (i) => AnimatedContainer(
                              duration: const Duration(milliseconds: 350),
                              curve: Curves.easeOut,
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              width: _imgIndex == i ? 22 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: _imgIndex == i
                                    ? Colors.white
                                    : Colors.white30,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      // badge + price
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: badgeColor,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(badgeText,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold)),
                          ),
                          Text(price,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15)),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // project name
                      Text(
                        (p['name'] ?? 'Project').toString(),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 5),

                      // location + units
                      Row(
                        children: [
                          const Icon(Icons.location_on,
                              color: Colors.white70, size: 15),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(location,
                                style: const TextStyle(
                                    color: Colors.white70, fontSize: 13),
                                overflow: TextOverflow.ellipsis),
                          ),
                          Text(unitsLabel,
                              style: TextStyle(
                                  color: soldOut
                                      ? Colors.redAccent
                                      : Colors.orangeAccent,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // view details button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.3),
                                  width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(s.viewDetails,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600)),
                                const SizedBox(width: 4),
                                const Icon(Icons.arrow_forward_ios,
                                    color: Colors.white, size: 10),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
