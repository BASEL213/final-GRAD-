import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/page_tracker.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> with PageTracker<SearchPage> {
  @override
  String get trackedPage => 'search';
  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText = Color(0xFF263238);

  List<dynamic> _results = [];
  bool _isSearching = false;
  String _query = '';

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) {
      setState(() { _results = []; _isSearching = false; });
      return;
    }
    setState(() => _isSearching = true);
    try {
      final res = await Dio().get('${ApiConfig.nodeApi}/projects',
          options: await ApiConfig.authOptions);
      final list = res.data is List ? res.data as List : (res.data['data'] as List? ?? []);
      final q = query.toLowerCase();
      setState(() {
        _results = list.where((p) {
          final name = (p['name'] ?? p['title'] ?? '').toString().toLowerCase();
          final loc  = (p['location'] ?? '').toString().toLowerCase();
          return name.contains(q) || loc.contains(q);
        }).toList();
        _isSearching = false;
      });
    } catch (_) {
      setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: darkText, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: TextField(
          autofocus: true,
          decoration: InputDecoration(
            hintText: "Search for units, locations...",
            hintStyle: TextStyle(color: Colors.grey.shade400),
            border: InputBorder.none,
          ),
          onChanged: (value) {
            _query = value;
            Future.delayed(const Duration(milliseconds: 400), () {
              if (_query == value) _search(value);
            });
          },
        ),
      ),
      body: _isSearching
          ? const Center(child: CircularProgressIndicator(color: primaryBlue))
          : _query.trim().isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Recent Searches",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: darkText)),
                      const SizedBox(height: 16),
                      _buildSearchTag("Apartments in New Cairo"),
                      _buildSearchTag("Social Housing Project 12"),
                      _buildSearchTag("Middle class units Downtown"),
                    ],
                  ),
                )
              : _results.isEmpty
                  ? const Center(
                      child: Text("No projects found.",
                          style: TextStyle(color: Colors.grey, fontSize: 15)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: _results.length,
                      itemBuilder: (context, index) {
                        final p = _results[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                          child: ListTile(
                            leading: const Icon(Icons.apartment, color: Color(0xFF1E88E5)),
                            title: Text(p['name'] ?? p['title'] ?? ''),
                            subtitle: Text((p['location'] ?? '').toString()),
                            trailing: Text(
                              p['availableUnits']?.toString() ?? '',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }

  Widget _buildSearchTag(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          const Icon(Icons.history, color: Colors.grey, size: 20),
          const SizedBox(width: 12),
          Text(text, style: const TextStyle(color: Colors.grey, fontSize: 15)),
          const Spacer(),
          const Icon(Icons.north_west, color: Colors.grey, size: 16),
        ],
      ),
    );
  }
}
