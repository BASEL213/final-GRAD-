import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:developer' as developer;
import 'package:findoor_app2/core/api_config.dart';
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

  final Dio _dio = Dio();
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
        _errorMessage =
            'Connection error. Make sure your laptop and phone are on the same Wi-Fi.';
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
        title: const Text(
          'Major Projects',
          style: TextStyle(
              color: darkText, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            onPressed: _fetchProjects,
            icon: const Icon(Icons.refresh, color: primaryBlue),
            tooltip: 'Refresh',
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
                hintText: 'Search projects…',
                hintStyle:
                    TextStyle(color: Colors.grey.shade400, fontSize: 14),
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
                                label: const Text('Retry',
                                    style: TextStyle(color: Colors.white)),
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
                                Text('No projects match "$_search"',
                                    style: TextStyle(
                                        color: Colors.grey.shade500,
                                        fontSize: 14)),
                              ],
                            ),
                          )
                        : ListView.builder(
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
  }

  @override
  void dispose() {
    _ctrl.dispose();
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
    final String imageUrl = (p['imageUrl'] ?? p['image'] ?? '').toString();

    final String unitsLabel = soldOut
        ? 'Sold Out'
        : (total > 0 ? '$available / $total Units' : '$available Units Left');

    Color badgeColor;
    switch (status) {
      case 'active':    badgeColor = Colors.green;  break;
      case 'planning':  badgeColor = Colors.orange; break;
      case 'completed': badgeColor = Colors.blue;   break;
      default:          badgeColor = Colors.grey;
    }

    final badgeText = soldOut ? 'SOLD OUT' : status.toUpperCase();
    final effectiveBadgeColor = soldOut ? Colors.red : badgeColor;

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
                // background image
                imageUrl.isNotEmpty
                    ? Image.network(imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Container(color: Colors.grey.shade200))
                    : Container(color: Colors.grey.shade200),

                // gradient overlay
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.85),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),

                // content
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: effectiveBadgeColor,
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
                      Text(
                        (p['name'] ?? 'Project').toString(),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 5),
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
                      // "View Details" hint
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
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('View Details',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600)),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_ios,
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
