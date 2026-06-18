import 'package:flutter/material.dart';
import 'application_page.dart';

class PropertyDetailsPage extends StatelessWidget {
  final Map<String, dynamic> property;

  const PropertyDetailsPage({super.key, required this.property});

  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText = Color(0xFF263238);

  @override
  Widget build(BuildContext context) {
    final p = property;

    final imageUrl = (p['imageUrl'] ?? p['image'] ?? '').toString();
    final title = (p['name'] ?? p['title'] ?? 'Project').toString();
    final location = p['location'] is Map
        ? ((p['location'] as Map)['city'] ?? '').toString()
        : (p['location'] ?? '').toString();
    final priceRange = (p['priceRange'] ?? p['price'] ?? 'On request').toString();
    final description = (p['description'] ?? '').toString();
    final status = (p['status'] ?? 'active').toString();
    final type = (p['type'] ?? '').toString();
    final availableUnits = _toInt(p['availableUnits']);
    final totalUnits = _toInt(p['totalUnits']);
    final completionDate = (p['completionDate'] ?? '').toString();
    final soldOut = availableUnits == 0 && totalUnits > 0;

    Color statusColor;
    switch (status) {
      case 'active':    statusColor = Colors.green; break;
      case 'planning':  statusColor = Colors.orange; break;
      case 'completed': statusColor = Colors.blue;  break;
      default:          statusColor = Colors.grey;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Hero image ────────────────────────────────────
                Stack(
                  children: [
                    imageUrl.isNotEmpty
                        ? Image.network(
                            imageUrl,
                            height: 380,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _placeholder(),
                          )
                        : _placeholder(),
                    // gradient
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha:0.35),
                              Colors.transparent,
                              Colors.black.withValues(alpha:0.55),
                            ],
                            stops: const [0.0, 0.4, 1.0],
                          ),
                        ),
                      ),
                    ),
                    // back button
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: CircleAvatar(
                          backgroundColor: Colors.white.withValues(alpha:0.9),
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back_ios_new, color: darkText, size: 20),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ),
                      ),
                    ),
                    // status + type badges at bottom-left of image
                    Positioned(
                      bottom: 16,
                      left: 20,
                      child: Row(
                        children: [
                          _badge(status.toUpperCase(), statusColor, Colors.white),
                          if (type.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            _badge(type, Colors.white.withValues(alpha:0.92), darkText),
                          ],
                        ],
                      ),
                    ),
                    // sold-out banner
                    if (soldOut)
                      Positioned(
                        top: 16,
                        right: 16,
                        child: _badge('SOLD OUT', Colors.red, Colors.white),
                      ),
                  ],
                ),

                // ── Content ───────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title + price
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(title,
                                style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: darkText,
                                    height: 1.2)),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE3F2FD),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(priceRange,
                                style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: primaryBlue)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.location_on, color: Colors.grey, size: 16),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(location,
                                style: const TextStyle(color: Colors.grey, fontSize: 13),
                                overflow: TextOverflow.ellipsis),
                          ),
                        ],
                      ),

                      // ── Units bar ──────────────────────────────
                      if (totalUnits > 0) ...[
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              soldOut
                                  ? 'No units available'
                                  : '$availableUnits of $totalUnits units available',
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: soldOut ? Colors.red : Colors.green.shade700),
                            ),
                            if (!soldOut)
                              Text(
                                '${((availableUnits / totalUnits) * 100).round()}% left',
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: totalUnits > 0 ? availableUnits / totalUnits : 0,
                            minHeight: 6,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation(
                                soldOut ? Colors.red : primaryBlue),
                          ),
                        ),
                      ],

                      // ── Completion date ────────────────────────
                      if (completionDate.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                    color: const Color(0xFFE3F2FD),
                                    borderRadius: BorderRadius.circular(10)),
                                child: const Icon(Icons.calendar_today,
                                    color: primaryBlue, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Expected Completion',
                                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  Text(_formatDate(completionDate),
                                      style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: darkText)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],

                      // ── Description ────────────────────────────
                      const SizedBox(height: 24),
                      const Text('About this Project',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: darkText)),
                      const SizedBox(height: 10),
                      Text(
                        description.isNotEmpty
                            ? description
                            : 'A premium housing development offering modern living with top-class amenities.',
                        style: const TextStyle(
                            color: Colors.blueGrey, height: 1.6, fontSize: 14),
                      ),

                      // ── Amenities ──────────────────────────────
                      const SizedBox(height: 28),
                      const Text('Amenities',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: darkText)),
                      const SizedBox(height: 16),
                      _buildAmenitiesGrid(),

                      const SizedBox(height: 110),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Bottom actions ─────────────────────────────────────
          _buildBottomActions(context, soldOut),
        ],
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────

  int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is double) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return raw;
    }
  }

  Widget _badge(String text, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
        child: Text(text,
            style: TextStyle(
                color: fg,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5)),
      );

  Widget _placeholder() => Container(
        height: 380,
        width: double.infinity,
        color: Colors.grey.shade100,
        child: Icon(Icons.apartment_rounded, size: 80, color: Colors.grey.shade300),
      );

  Widget _buildAmenitiesGrid() {
    final amenities = [
      (Icons.pool, 'Pool'),
      (Icons.fitness_center, 'Gym'),
      (Icons.wifi, 'Wi-Fi'),
      (Icons.local_parking, 'Parking'),
      (Icons.security, 'Security'),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: amenities
          .map((a) => Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(15)),
                    child: Icon(a.$1, color: primaryBlue),
                  ),
                  const SizedBox(height: 8),
                  Text(a.$2,
                      style:
                          const TextStyle(fontSize: 11, color: darkText)),
                ],
              ))
          .toList(),
    );
  }

  Widget _buildBottomActions(BuildContext context, bool soldOut) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha:0.07),
                blurRadius: 20,
                offset: const Offset(0, -5))
          ],
        ),
        child: Row(
          children: [
            // Contact button
            Container(
              decoration: BoxDecoration(
                  border: Border.all(color: primaryBlue.withValues(alpha:0.4)),
                  borderRadius: BorderRadius.circular(14)),
              child: IconButton(
                icon: const Icon(Icons.phone_outlined, color: primaryBlue),
                onPressed: () => _showContactSheet(context),
              ),
            ),
            const SizedBox(width: 12),
            // Apply Now / Sold Out button
            Expanded(
              child: ElevatedButton.icon(
                onPressed: soldOut
                    ? null
                    : () => Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const ApplicationPage())),
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      soldOut ? Colors.grey.shade300 : primaryBlue,
                  disabledBackgroundColor: Colors.grey.shade300,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                icon: Icon(
                    soldOut ? Icons.block : Icons.home_work_outlined,
                    color: Colors.white,
                    size: 20),
                label: Text(
                  soldOut ? 'Sold Out' : 'Apply Now',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showContactSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Contact Housing Agent',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.phone, color: primaryBlue),
              title: const Text('Call Agent'),
              subtitle: const Text('+20 2 1234 5678'),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              leading: const Icon(Icons.email, color: primaryBlue),
              title: const Text('Email Agent'),
              subtitle: const Text('housing@findoor.gov.eg'),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              leading: const Icon(Icons.location_on, color: primaryBlue),
              title: const Text('Visit Office'),
              subtitle: const Text('Findoor Housing Authority, Cairo'),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }
}
