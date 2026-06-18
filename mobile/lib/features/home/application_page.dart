import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:findoor_app2/core/api_config.dart';
import 'documents_vault_screen.dart';
import 'status_screen.dart';

class ApplicationPage extends StatefulWidget {
  const ApplicationPage({super.key});

  @override
  State<ApplicationPage> createState() => _ApplicationPageState();
}

class _ApplicationPageState extends State<ApplicationPage> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // --- Controllers ---
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _idController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _incomeController = TextEditingController();
  final TextEditingController _familySizeController = TextEditingController();
  final TextEditingController _housingDescController = TextEditingController();
  final TextEditingController _requirementsController = TextEditingController();

  // --- Dropdown Variables ---
  String? selectedProject;
  String? selectedUnitType;
  String? selectedFloor;
  String? selectedPaymentMethod;

  List<Map<String, dynamic>> _projects = [];
  List<String> _projectNames = [];
  int? _selectedProjectAvailableUnits;
  String? _selectedProjectId;
  String? _selectedProjectType;
  bool _loadingProjects = false;
  final Map<String, PlatformFile?> _selectedDocs = {};

  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText = Color(0xFF263238);

  @override
  void initState() {
    super.initState();
    _fetchProjects();
    _prefillFromPrefs();
  }

  Future<void> _prefillFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _fullNameController.text = prefs.getString('user_name')  ?? '';
        _idController.text       = prefs.getString('user_nid')   ?? '';
        _phoneController.text    = prefs.getString('user_phone') ?? '';
        _emailController.text    = prefs.getString('user_email') ?? '';
      });
    }
  }

  Future<void> _fetchProjects() async {
    setState(() => _loadingProjects = true);
    try {
      final res = await Dio().get('${ApiConfig.nodeApi}/projects');
      final list = res.data is List
          ? res.data as List
          : (res.data['data'] as List? ?? []);
      if (mounted) {
        final parsed = list
            .map<Map<String, dynamic>>((p) => {
                  'id': (p['_id'] ?? p['id'] ?? '').toString(),
                  'name': (p['name'] ?? p['title'] ?? '').toString(),
                  'location': p['location'] is Map
                      ? ((p['location'] as Map)['city'] ?? '').toString()
                      : (p['location'] ?? '').toString(),
                  'priceRange': (p['priceRange'] ?? '').toString(),
                  'availableUnits': p['availableUnits'] as int? ?? -1,
                  'totalUnits': p['totalUnits'] as int? ?? 0,
                  'imageUrl': (p['imageUrl'] ?? p['image'] ?? '').toString(),
                  'type': (p['type'] ?? '').toString(),
                })
            .where((p) => (p['name'] as String).isNotEmpty && (p['id'] as String).isNotEmpty)
            .toList();
        setState(() {
          _projects = parsed;
          _projectNames = parsed.map((p) => p['name'] as String).toList();
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _projectNames = []);
      }
    } finally {
      if (mounted) setState(() => _loadingProjects = false);
    }
  }

  // --- Functions ---

  void _handleNavigation() {
    if (_currentStep < 3) {
      if (_validateStep(_currentStep)) {
        setState(() => _currentStep++);
      }
    } else {
      _submitToBackend();
    }
  }

  bool _validateStep(int step) {
    switch (step) {
      case 0:
        return _formKey.currentState!.validate();
      case 1:
        if (_selectedProjectId == null || _selectedProjectId!.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please select a project to continue.'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ));
          return false;
        }
        if (_selectedProjectAvailableUnits != null && _selectedProjectAvailableUnits == 0) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('This project is sold out. Please select a different project.'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ));
          return false;
        }
        if (selectedUnitType == null || selectedUnitType!.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please select a unit type.'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ));
          return false;
        }
        if (selectedPaymentMethod == null || selectedPaymentMethod!.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please select a payment plan.'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ));
          return false;
        }
        return true;
      case 2:
        return _formKey.currentState!.validate();
      default:
        return true;
    }
  }

  Future<void> _submitToBackend() async {
    if (_selectedProjectId == null || _selectedProjectId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a project before submitting.'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator(color: primaryBlue)),
    );
    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
      ));
      final housing = _housingDescController.text.trim();
      final res = await dio.post(
        '${ApiConfig.nodeApi}/applications',
        options: Options(headers: {'Content-Type': 'application/json'}),
        data: {
          'name':            _fullNameController.text.trim(),
          'nationalId':      _idController.text.trim(),
          'email':           _emailController.text.trim(),
          'phone':           _phoneController.text.trim(),
          'projectId':       _selectedProjectId,
          'projectName':     selectedProject ?? '',
          'income':          int.tryParse(_incomeController.text.trim()) ?? 0,
          'familySize':      int.tryParse(_familySizeController.text.trim()) ?? 1,
          'currentHousing':  housing.length >= 10 ? housing : '$housing — submitted via mobile app',
          'unitType':            selectedUnitType ?? '',
          'preferredFloor':      selectedFloor ?? '',
          'paymentMethod':       selectedPaymentMethod ?? '',
          'specialRequirements': _requirementsController.text.trim(),
        },
      );
      if (!mounted) return;
      Navigator.pop(context);
      if (res.data['success'] == true) {
        final appId = (res.data['data']['_id'] ?? '') as String;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('tracking_code', appId);

        // Upload any selected documents and link them to this application
        if (appId.isNotEmpty && _selectedDocs.values.any((f) => f != null)) {
          try {
            final docFieldMap = {
              'National ID Copy (Front/Back)': 'nationalIdCopy',
              'Latest Income Certificate':     'incomeCertificate',
              'Family Status Document':        'familyStatusDocument',
            };
            final formData = FormData();
            for (final entry in _selectedDocs.entries) {
              final file = entry.value;
              final fieldName = docFieldMap[entry.key];
              if (file == null || fieldName == null) continue;
              final bytes = file.bytes;
              if (bytes != null) {
                formData.files.add(MapEntry(
                  fieldName,
                  MultipartFile.fromBytes(bytes, filename: file.name),
                ));
              } else if (file.path != null) {
                formData.files.add(MapEntry(
                  fieldName,
                  await MultipartFile.fromFile(file.path!, filename: file.name),
                ));
              }
            }
            if (formData.files.isNotEmpty) {
              await Dio().post(
                '${ApiConfig.nodeApi}/upload/application-docs/$appId',
                data: formData,
                options: await ApiConfig.authOptions,
              );
            }
          } catch (_) {
            // Non-fatal: application is created, documents just didn't upload
          }
        }

        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => StatusPage(trackingCode: appId)),
        );
      } else {
        final msg = res.data['message'] as String? ?? 'Submission failed. Please try again.';
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating),
        );
      }
    } on DioException catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      final errData = e.response?.data;
      final errMsg  = errData?['message'] as String? ?? '';

      // If the user already has an application, find it and show its status
      if (errMsg.toLowerCase().contains('already exists')) {
        final email = _emailController.text.trim();
        final nid   = _idController.text.trim();
        final query = email.isNotEmpty ? email : nid;
        if (query.isNotEmpty) {
          try {
            final lookup = await Dio(BaseOptions(
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
            )).get('${ApiConfig.nodeApi}/applications', queryParameters: {'search': query});
            final list = (lookup.data['data'] as List? ?? []);
            if (list.isNotEmpty && mounted) {
              final found = list.first as Map<String, dynamic>;
              final existingId = (found['_id'] ?? '').toString();
              if (existingId.isNotEmpty) {
                final prefs = await SharedPreferences.getInstance();
                await prefs.setString('tracking_code', existingId);
                if (!mounted) return;
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => StatusPage(trackingCode: existingId)),
                );
                return;
              }
            }
          } catch (_) {}
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You already have a submitted application. Use "My Status" to track it.'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }

      final msg = e.type == DioExceptionType.connectionError
          ? 'Cannot reach the server. Please check your connection.'
          : (errMsg.isNotEmpty ? errMsg :
              errData?['errors']?.first?['msg'] as String? ??
              'Submission failed. Please try again.');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text("Housing Application", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: darkText,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          _buildStepTracker(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(key: _formKey, child: _buildCurrentStepContent()),
            ),
          ),
          _buildBottomActions(),
        ],
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0: return _buildPersonalInfoStep();
      case 1: return _buildProjectInfoStep();
      case 2: return _buildFinancialAndHousingStep();
      case 3: return _buildDocumentStep();
      default: return const SizedBox();
    }
  }

  // --- Steps Build Methods ---

  Widget _buildPersonalInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(Icons.person_outline, "Personal Information"),
        const SizedBox(height: 20),
        _buildInputField("Full Name", Icons.person, _fullNameController,
          isRequired: true,
          hint: 'As on your National ID',
          validator: (v) {
            if (v == null || v.trim().length < 3) return 'Name must be at least 3 characters';
            return null;
          },
        ),
        _buildInputField("National ID", Icons.badge_outlined, _idController,
          isNumber: true,
          isRequired: true,
          hint: '14-digit number',
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'National ID is required';
            if (!RegExp(r'^[0-9]{14}$').hasMatch(v.trim())) return 'Must be exactly 14 digits';
            return null;
          },
        ),
        _buildInputField("Email Address", Icons.email_outlined, _emailController,
          isRequired: true,
          hint: 'example@mail.com',
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Email is required';
            if (!RegExp(r'^[\w.+-]+@[\w-]+\.\w{2,}$').hasMatch(v.trim())) return 'Enter a valid email address';
            return null;
          },
        ),
        _buildInputField("Phone Number", Icons.phone_android, _phoneController,
          isNumber: true,
          isRequired: true,
          hint: '01XXXXXXXXX (11 digits)',
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Phone number is required';
            if (!RegExp(r'^01[0-9]{9}$').hasMatch(v.trim())) return 'Must start with 01 and be 11 digits';
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildProjectInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(Icons.apartment_rounded, "Project Details"),
        const SizedBox(height: 20),
        // Required label for project
        RichText(
          text: const TextSpan(
            text: 'Preferred Project',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF263238)),
            children: [TextSpan(text: ' *', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold))],
          ),
        ),
        const SizedBox(height: 6),
        _loadingProjects
            ? const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: LinearProgressIndicator(color: primaryBlue),
              )
            : _buildProjectCards(),
        // Show availability info after a project is selected
        if (selectedProject != null && _selectedProjectAvailableUnits != null && _selectedProjectAvailableUnits! >= 0)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _selectedProjectAvailableUnits == 0
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(children: [
                      Icon(Icons.block, color: Colors.red.shade700, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text('This project is sold out. Please select a different project.', style: TextStyle(color: Colors.red.shade700, fontSize: 13))),
                    ]),
                  )
                : Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.green.shade200),
                    ),
                    child: Row(children: [
                      Icon(Icons.check_circle_outline, color: Colors.green.shade700, size: 18),
                      const SizedBox(width: 8),
                      Text('$_selectedProjectAvailableUnits units available', style: TextStyle(color: Colors.green.shade700, fontSize: 13, fontWeight: FontWeight.w600)),
                    ]),
                  ),
          ),
        _buildLabeledDropdown("Unit Type", _unitTypeOptions(), (v) => setState(() => selectedUnitType = v), isRequired: true, currentValue: selectedUnitType),
        _buildLabeledDropdown("Preferred Floor", ["Ground Floor", "Typical Floor", "Roof Floor"], (v) => setState(() => selectedFloor = v), isRequired: false, currentValue: selectedFloor),
        _buildLabeledDropdown("Payment Plan", ["Cash (Full)", "Installments (5 Years)", "Mortgage (20 Years)"], (v) => setState(() => selectedPaymentMethod = v), isRequired: true, currentValue: selectedPaymentMethod),
      ],
    );
  }

  Widget _buildFinancialAndHousingStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(Icons.monetization_on_outlined, "Financial Status"),
        const SizedBox(height: 20),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _buildInputField("Monthly Income (EGP)", Icons.wallet, _incomeController,
              isNumber: true, isRequired: true,
              hint: 'e.g. 5000',
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Income is required';
                final n = int.tryParse(v.trim());
                if (n == null || n < 0) return 'Enter a valid amount';
                return null;
              },
            )),
            const SizedBox(width: 15),
            Expanded(child: _buildInputField("Family Size", Icons.group_outlined, _familySizeController,
              isNumber: true, isRequired: true,
              hint: '1 – 20',
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                final n = int.tryParse(v.trim());
                if (n == null || n < 1 || n > 20) return '1 to 20';
                return null;
              },
            )),
          ],
        ),
        const Divider(height: 40),
        _sectionHeader(Icons.home_work_outlined, "Current Housing Context"),
        const SizedBox(height: 20),
        _buildInputField("Current Residence", Icons.info_outline, _housingDescController,
          isLongText: true, isRequired: true,
          hint: 'Describe where you live now (renting, family home, etc.)',
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Please describe your current housing';
            if (v.trim().length < 10) return 'At least 10 characters required';
            if (v.trim().length > 200) return 'Maximum 200 characters';
            return null;
          },
        ),
        _buildInputField("Special Requirements", Icons.star_border, _requirementsController,
          isLongText: true, isRequired: false,
          hint: 'Any health, disability, or social needs (optional)',
        ),
      ],
    );
  }

  Widget _buildDocumentStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(Icons.cloud_upload_outlined, "Verification Documents"),
        const SizedBox(height: 10),
        const Text("Use your vault for faster submission.", style: TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 25),
        _buildDocPicker("National ID Copy (Front/Back)"),
        _buildDocPicker("Latest Income Certificate"),
        _buildDocPicker("Family Status Document"),
      ],
    );
  }

  // --- UI Components ---

  Widget _sectionHeader(IconData icon, String title) {
    return Row(children: [
      Icon(icon, color: primaryBlue, size: 24),
      const SizedBox(width: 10),
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: darkText)),
    ]);
  }

  Widget _buildInputField(
    String label,
    IconData icon,
    TextEditingController controller, {
    bool isNumber = false,
    bool isLongText = false,
    bool isRequired = false,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF263238)),
              children: isRequired
                  ? const [TextSpan(text: ' *', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold))]
                  : [const TextSpan(text: '  (optional)', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.normal))],
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            maxLines: isLongText ? 3 : 1,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
            validator: validator,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20),
              filled: true,
              fillColor: Colors.white,
              errorStyle: const TextStyle(fontSize: 11),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: primaryBlue, width: 1.5)),
              errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.redAccent)),
              focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.redAccent, width: 1.5)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCards() {
    if (_projects.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(children: [
          Icon(Icons.info_outline, color: Colors.orange.shade700, size: 18),
          const SizedBox(width: 8),
          const Expanded(
            child: Text('No active projects available at this time.',
                style: TextStyle(fontSize: 13)),
          ),
        ]),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: _projects.map((p) {
          final name      = p['name'] as String;
          final location  = (p['location'] ?? '').toString();
          final price     = (p['priceRange'] ?? '').toString();
          final imageUrl  = (p['imageUrl'] ?? '').toString();
          final available = p['availableUnits'] as int;
          final total     = p['totalUnits'] as int;
          final soldOut   = available == 0 && total > 0;
          final selected  = selectedProject == name;

          return GestureDetector(
            onTap: soldOut ? null : () {
              setState(() {
                selectedProject                = name;
                _selectedProjectId             = p['id'] as String;
                _selectedProjectAvailableUnits = available;
                _selectedProjectType           = p['type'] as String?;
                selectedUnitType               = null; // reset when project changes
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: selected ? primaryBlue : Colors.grey.shade200,
                  width: selected ? 2 : 1.5,
                ),
                color: soldOut
                    ? Colors.grey.shade50
                    : (selected ? const Color(0xFFE3F2FD) : Colors.white),
                boxShadow: selected
                    ? [BoxShadow(color: primaryBlue.withValues(alpha: 0.15), blurRadius: 10, offset: const Offset(0, 4))]
                    : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2))],
              ),
              child: Row(
                children: [
                  // thumbnail
                  ClipRRect(
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
                    child: imageUrl.isNotEmpty
                        ? Image.network(
                            imageUrl,
                            width: 90,
                            height: 90,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _imgPlaceholder(),
                          )
                        : _imgPlaceholder(),
                  ),
                  // details
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: soldOut ? Colors.grey : darkText,
                              )),
                          if (location.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Row(children: [
                              Icon(Icons.location_on, size: 12, color: Colors.grey.shade400),
                              const SizedBox(width: 3),
                              Expanded(
                                child: Text(location,
                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                                    overflow: TextOverflow.ellipsis),
                              ),
                            ]),
                          ],
                          if (price.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(price,
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: primaryBlue)),
                          ],
                          const SizedBox(height: 6),
                          soldOut
                              ? Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade100,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('Sold Out',
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.red.shade700)),
                                )
                              : Text('$available of $total units available',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.green.shade700,
                                      fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                  ),
                  // selected indicator
                  Padding(
                    padding: const EdgeInsets.only(right: 14),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: selected
                          ? const CircleAvatar(
                              key: ValueKey('checked'),
                              radius: 12,
                              backgroundColor: primaryBlue,
                              child: Icon(Icons.check, color: Colors.white, size: 15),
                            )
                          : CircleAvatar(
                              key: const ValueKey('unchecked'),
                              radius: 12,
                              backgroundColor: Colors.grey.shade200,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _imgPlaceholder() => Container(
        width: 90,
        height: 90,
        color: Colors.grey.shade100,
        child: Icon(Icons.apartment_rounded, color: Colors.grey.shade300, size: 32),
      );

  List<String> _unitTypeOptions() {
    const apartments = ['Studio', '1-Bedroom Apartment', '2-Bedroom Apartment', '3-Bedroom Apartment'];
    const villas = ['Villa', 'Twin House', 'Town House'];
    switch (_selectedProjectType) {
      case 'Apartments': return apartments;
      case 'Villas':     return villas;
      case 'Mixed':      return [...apartments, ...villas];
      default:           return [...apartments, ...villas];
    }
  }

  Widget _buildLabeledDropdown(String label, List<String> items, Function(String?) onChanged, {bool isRequired = false, String? currentValue}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF263238)),
              children: isRequired
                  ? const [TextSpan(text: ' *', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold))]
                  : [const TextSpan(text: '  (optional)', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.normal))],
            ),
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            key: ValueKey(currentValue),
            initialValue: currentValue,
            decoration: InputDecoration(
              hintText: 'Select ${label.toLowerCase()}',
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: primaryBlue)),
            ),
            items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildDocPicker(String title) {
    final pickedFile = _selectedDocs[title];
    final isSelected = pickedFile != null;
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isSelected ? Colors.green.shade50 : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: isSelected ? Colors.green.shade200 : Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Icon(
            isSelected ? Icons.check_circle_rounded : Icons.file_present_rounded,
            color: isSelected ? Colors.green : primaryBlue,
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                if (isSelected)
                  Text(pickedFile.name, style: TextStyle(fontSize: 11, color: Colors.green.shade700)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => _showUploadOptions(title),
            style: ElevatedButton.styleFrom(
              backgroundColor: isSelected ? Colors.green : primaryBlue,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: Text(isSelected ? "Replace" : "Select", style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showUploadOptions(String docTitle) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("How to add this document?", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.upload_file, color: Colors.green),
              title: const Text("Upload from Device"),
              subtitle: const Text("Pick any PDF or image file"),
              onTap: () async {
                Navigator.pop(ctx);
                await _pickFileFromDevice(docTitle);
              },
            ),
            ListTile(
              leading: const Icon(Icons.security_outlined, color: primaryBlue),
              title: const Text("Select from Documents Vault"),
              onTap: () {
                Navigator.pop(ctx);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const DocumentsVaultScreen()));
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickFileFromDevice(String docTitle) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
        withData: true,
      );
      if (result != null && result.files.isNotEmpty && mounted) {
        final file = result.files.first;
        setState(() => _selectedDocs[docTitle] = file);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('${file.name} selected'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Could not open file picker. Please try again.'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  Widget _buildStepTracker() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(4, (index) => _buildStepItem(index)),
      ),
    );
  }

  Widget _buildStepItem(int index) {
    bool isActive = _currentStep >= index;
    bool isCompleted = _currentStep > index;
    return Row(
      children: [
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(color: isCompleted ? Colors.green : (isActive ? primaryBlue : Colors.grey.shade200), shape: BoxShape.circle),
          child: Center(child: isCompleted ? const Icon(Icons.check, color: Colors.white, size: 16) : Text("${index + 1}", style: TextStyle(color: isActive ? Colors.white : Colors.grey, fontWeight: FontWeight.bold))),
        ),
        if (index < 3) Container(width: 40, height: 2, color: _currentStep > index ? Colors.green : Colors.grey.shade200),
      ],
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Colors.grey.shade100))),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(child: OutlinedButton(onPressed: () => setState(() => _currentStep--), style: OutlinedButton.styleFrom(minimumSize: const Size(0, 55)), child: const Text("Back"))),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: _handleNavigation,
              style: ElevatedButton.styleFrom(backgroundColor: primaryBlue, minimumSize: const Size(0, 55), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: Text(_currentStep == 3 ? "Submit Application" : "Continue", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

}