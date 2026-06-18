import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'package:findoor_app2/core/page_tracker.dart';

class WalletPage extends StatefulWidget {
  const WalletPage({super.key});

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> with PageTracker<WalletPage> {
  @override
  String get trackedPage => 'wallet';
  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText    = Color(0xFF263238);

  static const double _appFee        = 150.0;
  static const double _processingFee =  50.0;
  static const double _depositAmount = 5000.0;

  String _userName   = '';
  bool   _isLoading  = true;
  Map<String, dynamic>? _application;
  String _appStatus  = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final prefs = await SharedPreferences.getInstance();
    final name  = prefs.getString('user_name') ?? 'Member';
    final code  = prefs.getString('tracking_code') ?? '';

    if (!mounted) return;
    setState(() => _userName = name);

    if (code.isNotEmpty) {
      try {
        final res = await Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        )).get('${ApiConfig.nodeApi}/applications/$code',
            options: await ApiConfig.authOptions);

        if (res.data['success'] == true && mounted) {
          setState(() {
            _application = res.data['data'] as Map<String, dynamic>;
            _appStatus   = (_application!['status'] as String? ?? 'pending');
          });
        }
      } catch (_) {}
    }

    if (mounted) setState(() => _isLoading = false);
  }

  double get _totalDue {
    if (_appStatus == 'approved') return _depositAmount;
    if (_appStatus == 'pending')  return _appFee + _processingFee;
    return 0.0;
  }

  double get _totalPaid {
    if (_appStatus == 'approved' || _appStatus == 'rejected') return _appFee + _processingFee;
    return 0.0;
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
        title: const Text('Housing Fees',
            style: TextStyle(color: darkText, fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: darkText),
            tooltip: 'Refresh',
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryBlue))
          : RefreshIndicator(
              color: primaryBlue,
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBalanceCard(),
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        Expanded(child: _actionButton(Icons.credit_card,   'Pay Now',   _onPayNow)),
                        const SizedBox(width: 12),
                        Expanded(child: _actionButton(Icons.receipt_long,  'Statement', _onStatement)),
                        const SizedBox(width: 12),
                        Expanded(child: _actionButton(Icons.support_agent, 'Support',   _onSupport)),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Text(
                      _application == null ? 'No Active Application' : 'Fee Breakdown',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: darkText),
                    ),
                    const SizedBox(height: 16),
                    if (_application == null)
                      _buildNoApplicationCard()
                    else
                      ..._buildFeeItems(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E88E5), Color(0xFF1565C0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E88E5).withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Amount Due', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(
                    'EGP ${_totalDue.toStringAsFixed(2)}',
                    style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              if (_appStatus.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _appStatus.toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Account Holder', style: TextStyle(color: Colors.white54, fontSize: 11)),
                  Text(_userName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Paid So Far', style: TextStyle(color: Colors.white54, fontSize: 11)),
                  Text(
                    'EGP ${_totalPaid.toStringAsFixed(2)}',
                    style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _actionButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: primaryBlue, size: 26),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: darkText)),
          ],
        ),
      ),
    );
  }

  Widget _buildNoApplicationCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Icon(Icons.receipt_long_outlined, size: 52, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No Application Yet',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: darkText)),
          const SizedBox(height: 8),
          Text(
            'Submit a housing application to see your fee breakdown here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildFeeItems() {
    final projectName = (_application?['projectName'] as String? ?? 'Housing Project');

    final items = <Map<String, dynamic>>[
      {
        'title': 'Application Submission Fee',
        'desc':  'Required to process your application',
        'amount': _appFee,
        'paid':   _appStatus == 'approved' || _appStatus == 'rejected',
        'icon':   Icons.assignment_turned_in_outlined,
        'urgent': false,
      },
      {
        'title': 'Document Processing Fee',
        'desc':  'Administrative document review',
        'amount': _processingFee,
        'paid':   _appStatus == 'approved' || _appStatus == 'rejected',
        'icon':   Icons.description_outlined,
        'urgent': false,
      },
      if (_appStatus == 'approved')
        {
          'title': 'Unit Reservation Deposit',
          'desc':  '$projectName — Required before contract signing',
          'amount': _depositAmount,
          'paid':   false,
          'icon':   Icons.home_outlined,
          'urgent': true,
        },
    ];

    return items.map((item) => _feeCard(item)).toList();
  }

  Widget _feeCard(Map<String, dynamic> item) {
    final isPaid   = item['paid']   as bool;
    final isUrgent = item['urgent'] as bool;
    final amount   = item['amount'] as double;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: isUrgent ? Border.all(color: Colors.orange.shade300, width: 1.5) : null,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isPaid
                  ? Colors.green.withValues(alpha: 0.1)
                  : isUrgent
                      ? Colors.orange.withValues(alpha: 0.1)
                      : primaryBlue.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              item['icon'] as IconData,
              color: isPaid ? Colors.green : isUrgent ? Colors.orange : primaryBlue,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['title'] as String,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: darkText)),
                const SizedBox(height: 3),
                Text(item['desc'] as String,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'EGP ${amount.toStringAsFixed(0)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: isPaid ? Colors.green : isUrgent ? Colors.orange : darkText,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isPaid
                      ? Colors.green.withValues(alpha: 0.1)
                      : isUrgent
                          ? Colors.orange.withValues(alpha: 0.1)
                          : Colors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isPaid ? 'Paid' : isUrgent ? 'Due Now' : 'Pending',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isPaid ? Colors.green : isUrgent ? Colors.orange : Colors.grey.shade600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _onPayNow() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(children: [
          Icon(Icons.credit_card, color: primaryBlue),
          SizedBox(width: 10),
          Text('Online Payment'),
        ]),
        content: const Text(
          'Online payment will be available soon.\n\n'
          'Please visit your nearest Findoor Housing Office to pay in person.\n\n'
          'Office hours: Sun–Thu, 9:00 AM – 3:00 PM',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
        ],
      ),
    );
  }

  void _onStatement() {
    if (_application == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No application on file yet.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Fee Statement'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _statRow('Application Fee', 'EGP 150'),
            _statRow('Processing Fee',  'EGP 50'),
            if (_appStatus == 'approved') _statRow('Deposit Due', 'EGP 5,000'),
            const Divider(height: 20),
            _statRow('Status',  _appStatus.toUpperCase()),
            _statRow('Project', _application?['projectName'] as String? ?? '—'),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(value,  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }

  void _onSupport() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payment Support',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.phone, color: primaryBlue),
              title: const Text('Call Finance Office'),
              subtitle: const Text('+20 2 1234 5678'),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              leading: const Icon(Icons.email_outlined, color: primaryBlue),
              title: const Text('Email Support'),
              subtitle: const Text('payments@findoor.gov.eg'),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }
}
