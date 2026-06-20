import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:findoor_app2/core/lang.dart';
import 'package:findoor_app2/core/page_tracker.dart';
import 'package:findoor_app2/features/home/nid_scan_screen.dart';

class DocumentsVaultScreen extends StatefulWidget {
  const DocumentsVaultScreen({super.key});

  @override
  State<DocumentsVaultScreen> createState() => _DocumentsVaultScreenState();
}

class _DocumentsVaultScreenState extends State<DocumentsVaultScreen>
    with PageTracker<DocumentsVaultScreen> {
  @override
  String get trackedPage => 'documents';

  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText    = Color(0xFF263238);

  // 'path' key added so View can open the actual file
  Map<String, Map<String, String?>?> uploadedDocs = {
    'National ID (Front)':  null,
    'National ID (Back)':   null,
    'Income Certificate':   null,
    'Utility Bill':         null,
    'Birth Certificate':    null,
  };

  static const _nidDocs = {'National ID (Front)', 'National ID (Back)'};

  // ── Picking ──────────────────────────────────────────────────────────────

  Future<void> _pickFile(String docType) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
      );
      if (result != null && result.files.isNotEmpty && mounted) {
        final file = result.files.first;
        final sizeStr = file.size > 1024 * 1024
            ? '${(file.size / (1024 * 1024)).toStringAsFixed(1)} MB'
            : '${(file.size / 1024).toStringAsFixed(0)} KB';
        setState(() {
          uploadedDocs[docType] = {
            'name': file.name,
            'size': sizeStr,
            'date': _todayLabel(),
            'path': file.path ?? '',
          };
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(S.current.addedToVault(file.name)),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(S.current.couldNotOpenFilePicker),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  Future<void> _pickFromGallery(String docType) async {
    try {
      final img = await ImagePicker()
          .pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (img != null && mounted) {
        final bytes = await img.readAsBytes();
        final sizeKb = (bytes.length / 1024).toStringAsFixed(0);
        setState(() {
          uploadedDocs[docType] = {
            'name': img.name,
            'size': '$sizeKb KB',
            'date': _todayLabel(),
            'path': img.path,
          };
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(S.current.addedToVault(img.name)),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(S.current.couldNotOpenGallery),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  // ── View ─────────────────────────────────────────────────────────────────

  void _viewDocument(String docType) {
    final fileData = uploadedDocs[docType];
    if (fileData == null) return;

    final path = fileData['path'] ?? '';
    final name = fileData['name'] ?? docType;
    final lower = name.toLowerCase();
    final isImage = lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // handle
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      name,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: darkText),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: isImage && path.isNotEmpty && File(path).existsSync()
                  ? InteractiveViewer(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.file(
                            File(path),
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) =>
                                _previewFallback(name, fileData),
                          ),
                        ),
                      ),
                    )
                  : _previewFallback(name, fileData),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _previewFallback(String name, Map<String, String?> fileData) {
    final isPdf = name.toLowerCase().endsWith('.pdf');
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isPdf ? Icons.picture_as_pdf : Icons.insert_drive_file_outlined,
            size: 72,
            color: isPdf ? Colors.redAccent : Colors.blueGrey,
          ),
          const SizedBox(height: 16),
          Text(name,
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 15),
              textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text('Size: ${fileData['size'] ?? '—'}',
              style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text('Uploaded: ${fileData['date'] ?? '—'}',
              style: const TextStyle(color: Colors.grey, fontSize: 13)),
          if (isPdf) ...[
            const SizedBox(height: 20),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.info_outline, color: Colors.orange, size: 18),
                  const SizedBox(width: 8),
                  Text(S.current.pdfPreviewNotAvailable,
                      style: const TextStyle(
                          fontSize: 13, color: Colors.orange)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  void _deleteDocument(String docType) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(S.current.removeDocument,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        content: Text(S.current.removeDocConfirm(docType)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(S.current.cancel)),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10))),
            onPressed: () {
              setState(() => uploadedDocs[docType] = null);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text(S.current.removedFromVault(docType)),
                behavior: SnackBarBehavior.floating,
              ));
            },
            child: Text(S.current.remove,
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── NID sheet ─────────────────────────────────────────────────────────────

  void _showNidUploadSheet(String docType) {
    final isFront = docType == 'National ID (Front)';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Text(S.current.addDoc(docType),
                style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: darkText)),
            const SizedBox(height: 6),
            Text(
              isFront
                  ? S.current.scanWithOcrDesc
                  : S.current.uploadPhotoBack,
              style: TextStyle(
                  fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            if (isFront) ...[
              _sheetOption(
                icon: Icons.document_scanner_rounded,
                color: primaryBlue,
                title: S.current.scanWithNidScanner,
                subtitle: S.current.autoReadCard,
                onTap: () async {
                  Navigator.pop(context);
                  final result =
                      await Navigator.push<Map<String, String>>(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const NIDScanScreen()),
                  );
                  if (result != null && mounted) {
                    await _pickFile(docType);
                  }
                },
                isPrimary: true,
              ),
              const SizedBox(height: 12),
            ],
            _sheetOption(
              icon: Icons.photo_library_outlined,
              color: Colors.grey.shade700,
              title: S.current.uploadFromGallery,
              subtitle: S.current.chooseExistingPhoto,
              onTap: () async {
                Navigator.pop(context);
                await _pickFromGallery(docType);
              },
              isPrimary: false,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(S.current.cancel,
                    style: TextStyle(color: Colors.grey.shade500)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  String _todayLabel() {
    final now = DateTime.now();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${now.day} ${months[now.month - 1]} ${now.year}';
  }

  Widget _sheetOption({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isPrimary,
  }) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isPrimary
                ? primaryBlue.withValues(alpha: 0.06)
                : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isPrimary
                  ? primaryBlue.withValues(alpha: 0.3)
                  : Colors.grey.shade200,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: isPrimary
                      ? primaryBlue.withValues(alpha: 0.12)
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon,
                    color: isPrimary ? primaryBlue : color, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isPrimary ? primaryBlue : darkText)),
                    const SizedBox(height: 3),
                    Text(subtitle,
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded,
                  color: isPrimary
                      ? primaryBlue
                      : Colors.grey.shade400,
                  size: 20),
            ],
          ),
        ),
      );

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final int uploadedCount =
        uploadedDocs.values.where((v) => v != null).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: primaryBlue,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                      colors: [primaryBlue, Color(0xFF1565C0)]),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    const Icon(Icons.security_rounded,
                        color: Colors.white, size: 40),
                    const SizedBox(height: 10),
                    Text(S.current.secureDocumentsVault,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold)),
                    Text(
                        S.current.filesSecured(uploadedCount, uploadedDocs.length),
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7))),
                  ],
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new,
                  color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverList(
              delegate: SliverChildListDelegate(<Widget>[
                _buildStatsRow(uploadedCount, uploadedDocs.length),
                const SizedBox(height: 30),
                Text(S.current.yourPaperwork,
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: darkText)),
                const SizedBox(height: 15),
                ...uploadedDocs.keys
                    .map((docType) => _buildDocCard(docType)),
                _buildSecurityNote(),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // ── Stats row ─────────────────────────────────────────────────────────────

  Widget _buildStatsRow(int uploaded, int total) => Row(
        children: [
          _statItem(S.current.uploaded, uploaded.toString(), Colors.green),
          const SizedBox(width: 15),
          _statItem(S.current.missing, (total - uploaded).toString(), Colors.orange),
        ],
      );

  Widget _statItem(String label, String value, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10)
            ],
          ),
          child: Column(
            children: [
              Text(value,
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: color)),
              Text(label,
                  style:
                      const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ),
      );

  // ── Document card ─────────────────────────────────────────────────────────

  Widget _buildDocCard(String title) {
    final fileData = uploadedDocs[title];
    final isUploaded = fileData != null;
    final isNid = _nidDocs.contains(title);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: isUploaded
                ? primaryBlue.withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isUploaded
                  ? Colors.green.withValues(alpha: 0.1)
                  : Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isUploaded
                  ? Icons.check_circle
                  : Icons.pending_actions_rounded,
              color: isUploaded ? Colors.green : Colors.grey,
              size: 20,
            ),
          ),
          title: Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 15)),
          subtitle: Text(
            isUploaded ? S.current.verifiedFile : S.current.waitingForUpload,
            style: TextStyle(
                color: isUploaded ? Colors.green : Colors.grey,
                fontSize: 12),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── File details ────────────────────────
                    if (isUploaded) ...[
                      _fileDetailRow(S.current.fileName, fileData['name']!),
                      _fileDetailRow(S.current.sizeLabel, fileData['size']!),
                      _fileDetailRow(S.current.dateLabel, fileData['date']!),
                      const Divider(height: 20),
                    ],

                    // ── Action buttons ──────────────────────
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.end,
                      children: [
                        // View — only when a file is uploaded
                        if (isUploaded)
                          OutlinedButton.icon(
                            onPressed: () => _viewDocument(title),
                            icon: const Icon(
                                Icons.remove_red_eye_outlined,
                                size: 16),
                            label: Text(S.current.view),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: primaryBlue,
                              side: const BorderSide(
                                  color: primaryBlue),
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(8)),
                              padding:
                                  const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                            ),
                          ),

                        // Delete — only when a file is uploaded
                        if (isUploaded)
                          OutlinedButton.icon(
                            onPressed: () => _deleteDocument(title),
                            icon: const Icon(Icons.delete_outline,
                                size: 16),
                            label: Text(S.current.delete),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.redAccent,
                              side: const BorderSide(
                                  color: Colors.redAccent),
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(8)),
                              padding:
                                  const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                            ),
                          ),

                        // Upload / Replace / Scan button
                        isNid
                            ? ElevatedButton.icon(
                                onPressed: () =>
                                    _showNidUploadSheet(title),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isUploaded
                                      ? Colors.white
                                      : primaryBlue,
                                  foregroundColor: isUploaded
                                      ? primaryBlue
                                      : Colors.white,
                                  elevation: 0,
                                  side: isUploaded
                                      ? const BorderSide(
                                          color: primaryBlue)
                                      : BorderSide.none,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(8)),
                                  padding:
                                      const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 8),
                                ),
                                icon: Icon(
                                  isUploaded
                                      ? Icons.refresh
                                      : Icons.document_scanner_rounded,
                                  size: 16,
                                ),
                                label: Text(
                                    isUploaded
                                        ? S.current.replace
                                        : S.current.scanUpload),
                              )
                            : ElevatedButton.icon(
                                onPressed: () => _pickFile(title),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isUploaded
                                      ? Colors.white
                                      : primaryBlue,
                                  foregroundColor: isUploaded
                                      ? primaryBlue
                                      : Colors.white,
                                  elevation: 0,
                                  side: isUploaded
                                      ? const BorderSide(
                                          color: primaryBlue)
                                      : BorderSide.none,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(8)),
                                  padding:
                                      const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 8),
                                ),
                                icon: Icon(
                                    isUploaded
                                        ? Icons.refresh
                                        : Icons.upload,
                                    size: 16),
                                label: Text(
                                    isUploaded
                                        ? S.current.replace
                                        : S.current.uploadNow),
                              ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fileDetailRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style:
                    const TextStyle(color: Colors.grey, fontSize: 12)),
            Text(value,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 12)),
          ],
        ),
      );

  Widget _buildSecurityNote() => Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.amber.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: Colors.amber.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.amber, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                S.current.securityNote,
                style:
                    const TextStyle(fontSize: 12, color: Colors.black87),
              ),
            ),
          ],
        ),
      );
}
