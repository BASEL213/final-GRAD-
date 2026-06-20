import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LangNotifier extends ChangeNotifier {
  static late LangNotifier _instance;
  static LangNotifier get instance => _instance;

  bool _isAr = true;
  bool get isAr => _isAr;

  LangNotifier() {
    _instance = this;
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    _isAr = (prefs.getString('app_lang') ?? 'ar') != 'en';
    notifyListeners();
  }

  Future<void> toggle() async {
    _isAr = !_isAr;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_lang', _isAr ? 'ar' : 'en');
    notifyListeners();
  }
}

class S {
  final bool isAr;
  const S._(this.isAr);

  static S of(BuildContext context) => S._(context.watch<LangNotifier>().isAr);
  static S get current => S._(LangNotifier.instance.isAr);

  TextDirection get dir => isAr ? TextDirection.rtl : TextDirection.ltr;

  // Splash
  String get govHousingPortal => isAr ? 'بوابة الإسكان الحكومي' : 'Government Housing Portal';
  String get secureDigitalService => isAr ? 'خدمة رقمية آمنة' : 'SECURE DIGITAL SERVICE';

  // Shared auth
  String get emailAddress => isAr ? 'البريد الإلكتروني' : 'Email Address';
  String get password => isAr ? 'كلمة المرور' : 'Password';
  String get emailRequired => isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
  String get emailInvalid => isAr ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email';
  String get passwordRequired => isAr ? 'كلمة المرور مطلوبة' : 'Password is required';
  String get createAccount => isAr ? 'إنشاء حساب' : 'Create Account';
  String get cancel => isAr ? 'إلغاء' : 'Cancel';

  // Login
  String get welcomeBack => isAr ? 'مرحباً بعودتك' : 'Welcome Back';
  String get signInSubtitle => isAr ? 'سجل دخولك للوصول لخدمات الإسكان' : 'Sign in to access housing services';
  String get forgotPassword => isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?';
  String get loginBtn => isAr ? 'تسجيل الدخول' : 'LOGIN';
  String get noAccount => isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? ";
  String get encryptedConnection => isAr ? 'اتصال مشفر من طرف إلى طرف' : 'End-to-end encrypted connection';
  String get cannotReachServer => isAr
      ? 'لا يمكن الوصول للخادم.\nتأكد من أن جهازك والحاسوب على نفس الشبكة.'
      : 'Cannot reach server.\nEnsure your device and laptop are on the same Wi-Fi.';
  String get loginFailed => isAr ? 'فشل تسجيل الدخول. تحقق من بياناتك.' : 'Login failed. Check your credentials.';

  // Register
  String get startJourney => isAr ? 'ابدأ رحلتك مع فيندور' : 'Start your journey with Findoor';
  String get fullName => isAr ? 'الاسم الكامل' : 'Full Name';
  String get asOnId => isAr ? 'كما هو في الهوية' : 'As written in your ID';
  String get nationalId => isAr ? 'الرقم القومي' : 'National ID';
  String get fourteenDigits => isAr ? 'رقم مكون من 14 خانة' : '14 digits number';
  String get phoneNumber => isAr ? 'رقم الهاتف' : 'Phone Number';
  String get confirmPassword => isAr ? 'تأكيد كلمة المرور' : 'Confirm Password';
  String get reEnterPassword => isAr ? 'أعد إدخال كلمة المرور' : 'Re-enter password';
  String get fieldRequired => isAr ? 'هذا الحقل مطلوب' : 'This field is required';
  String get nidMust14 => isAr ? 'الرقم القومي يجب أن يكون 14 خانة' : 'National ID must be 14 digits';
  String get invalidPhone => isAr ? 'رقم هاتف غير صحيح' : 'Invalid phone number';
  String get scanNid => isAr ? 'امسح الهوية لملء الاسم والرقم تلقائياً' : 'Scan NID to auto-fill Name & ID';
  String get nidScanned => isAr ? 'تم المسح — اضغط للإعادة' : 'NID Scanned — tap to re-scan';
  String get createAccountBtn => isAr ? 'إنشاء الحساب' : 'CREATE ACCOUNT';
  String get alreadyHaveAccount => isAr ? 'لديك حساب بالفعل؟ سجل الدخول' : 'Already have an account? Login';
  String get accountCreated => isAr ? 'تم إنشاء الحساب!' : 'Account Created!';
  String get welcomeToFindoor => isAr ? 'مرحباً في فيندور. اكتمل تسجيلك.' : 'Welcome to Findoor. Your registration is complete.';
  String get goToLogin => isAr ? 'الذهاب لتسجيل الدخول' : 'Go to Login';
  String get passwordsNoMatch => isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';

  // Forgot password
  String get recoveryMethod => isAr ? 'طريقة الاسترداد' : 'Recovery Method';
  String get howReceiveCode => isAr ? 'كيف تريد استلام رمز إعادة التعيين؟' : 'How would you like to receive the reset code?';
  String get viaEmail => isAr ? 'عبر البريد الإلكتروني' : 'Via Email Address';
  String get sendToGmail => isAr ? 'إرسال إلى بريدك الإلكتروني المسجل' : 'Send to your registered Gmail';
  String get viaPhone => isAr ? 'عبر رقم الهاتف' : 'Via Phone Number';
  String get sendAsSms => isAr ? 'إرسال كرسالة SMS لهاتفك' : 'Send as SMS to your mobile';
  String get sendRecoveryCode => isAr ? 'إرسال رمز الاسترداد' : 'SEND RECOVERY CODE';
  String get resetSent => isAr ? 'تم إرسال تعليمات إعادة التعيين لبريدك الإلكتروني.' : 'Reset instructions sent to your email.';
  String get cannotReachServerShort => isAr ? 'لا يمكن الوصول للخادم. تحقق من اتصالك.' : 'Cannot reach server. Check your connection.';

  // OTP password reset
  String get enterYourEmail => isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email';
  String get sendOtp => isAr ? 'إرسال كود التحقق' : 'SEND OTP';
  String get otpSentTo => isAr ? 'تم إرسال كود التحقق إلى' : 'OTP sent to';
  String get enterOtp => isAr ? 'أدخل كود التحقق المكون من 6 أرقام' : 'Enter the 6-digit OTP';
  String get otpHint => isAr ? 'الكود المرسل إلى بريدك' : 'Code sent to your email';
  String get verifyOtp => isAr ? 'تحقق من الكود' : 'VERIFY OTP';
  String get resetPasswordBtn => isAr ? 'إعادة تعيين كلمة المرور' : 'RESET PASSWORD';
  String get passwordResetSuccess => isAr ? 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' : 'Password reset successfully. You can now log in.';
  String get invalidOtp => isAr ? 'الكود غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired OTP.';
  String get otpRequired => isAr ? 'الرجاء إدخال كود التحقق' : 'Please enter the OTP';
  String get otpMust6 => isAr ? 'الكود يجب أن يكون 6 أرقام' : 'OTP must be 6 digits';
  String get resendOtp => isAr ? 'إعادة الإرسال' : 'Resend OTP';
  String get step1EnterEmail => isAr ? 'الخطوة 1: أدخل بريدك الإلكتروني' : 'Step 1: Enter your email';
  String get step2EnterOtp => isAr ? 'الخطوة 2: أدخل كود التحقق' : 'Step 2: Enter the OTP';
  String get step3NewPassword => isAr ? 'الخطوة 3: كلمة المرور الجديدة' : 'Step 3: New Password';

  // Google Sign-In
  String get orContinueWith => isAr ? 'أو تابع بـ' : 'Or continue with';
  String get signInWithGoogle => isAr ? 'تسجيل الدخول بـ Google' : 'Sign in with Google';
  String get googleSignInFailed => isAr ? 'فشل تسجيل الدخول بـ Google. حاول مرة أخرى.' : 'Google sign-in failed. Please try again.';
  String get googleSignInCancelled => isAr ? 'تم إلغاء تسجيل الدخول بـ Google.' : 'Google sign-in was cancelled.';

  // Home
  String get hiThere => isAr ? 'أهلاً' : 'Hi there';
  String hi(String name) => isAr ? 'أهلاً $name' : 'Hi $name';
  String get goodMorning => isAr ? 'صباح الخير،' : 'Good Morning,';
  String get viewProfile => isAr ? 'عرض الملف الشخصي' : 'View Profile';
  String get startApplicationTooltip => isAr ? 'ابدأ طلب إسكان جديد' : 'Start a new housing application';
  String get applyNow => isAr ? 'قدم الآن' : 'Apply Now';
  String get startNewApplication => isAr ? 'بدء طلب جديد' : 'Start New Application';
  String get myStatus => isAr ? 'حالة طلبي' : 'My Status';
  String get trackStatus => isAr ? 'تتبع حالة طلبك' : 'Track your application status';
  String get eWallet => isAr ? 'المحفظة الإلكترونية' : 'E-Wallet';
  String get viewBalance => isAr ? 'عرض الرصيد والمدفوعات' : 'View balance and payments';
  String get myDocuments => isAr ? 'مستنداتي' : 'My Documents';
  String get viewManageFiles => isAr ? 'عرض وإدارة الملفات' : 'View and manage uploaded files';
  String get featuredProperties => isAr ? 'المشاريع المميزة' : 'Featured Properties';
  String get noProjectsAvailable => isAr ? 'لا توجد مشاريع متاحة' : 'No projects available';
  String get socialHousing => isAr ? 'إسكان اجتماعي' : 'SOCIAL HOUSING';
  String unitsLeft(int n) => isAr ? '$n وحدات متبقية' : '$n units left';
  String get homeTab => isAr ? 'الرئيسية' : 'Home';
  String get projectsTab => isAr ? 'المشاريع' : 'Projects';
  String get searchTab => isAr ? 'بحث' : 'Search';
  String get profileTab => isAr ? 'الملف الشخصي' : 'Profile';
  String get noApplicationFound => isAr ? 'لم يتم العثور على طلب لحسابك.' : 'No application found for your account.';

  // Status
  String get applicationStatus => isAr ? 'حالة الطلب' : 'Application Status';
  String get refresh => isAr ? 'تحديث' : 'Refresh';
  String get approved => isAr ? 'مقبول' : 'Approved';
  String get rejected => isAr ? 'مرفوض' : 'Rejected';
  String get underReview => isAr ? 'قيد المراجعة' : 'Under Review';
  String get trackingCodeLabel => isAr ? 'رمز التتبع: ' : 'Tracking Code: ';
  String get copy => isAr ? 'نسخ' : 'Copy';
  String get trackingCodeCopied => isAr ? 'تم نسخ رمز التتبع!' : 'Tracking code copied!';
  String get couldNotReachServer => isAr ? 'لا يمكن الوصول للخادم.' : 'Cannot reach server.';
  String get couldNotLoadStatus => isAr ? 'تعذر تحميل الحالة.' : 'Could not load status.';
  String get retry => isAr ? 'إعادة المحاولة' : 'Retry';
  String get underOfficialReview => isAr ? 'قيد المراجعة الرسمية' : 'Under Official Review';
  String get verifyingDocs => isAr
      ? 'يقوم موظف حكومي بالتحقق من مستنداتك وأهليتك.'
      : 'A government officer is currently verifying your documents and eligibility.';
  String get readyForContract => isAr ? 'جاهز للتعاقد' : 'Ready for Contract';
  String get applicationAccepted => isAr
      ? 'تم قبول طلبك. يرجى التوجه لمكتب الإسكان لاتخاذ الإجراءات التالية.'
      : 'Your application was accepted. Please proceed to the housing office for next steps.';
  String get reviewDeclined => isAr ? 'تم رفض المراجعة' : 'Review Declined';
  String get applicationNotApproved => isAr
      ? 'لم تتم الموافقة على طلبك حالياً. يمكنك إعادة التقديم أو التواصل مع الدعم.'
      : 'Your application was not approved at this time. You may re-apply or contact support.';
  String get statusUpdatedLabel => isAr ? 'تم تحديث الحالة' : 'Status Updated';
  String get checkBackLater => isAr ? 'يرجى المراجعة لاحقاً لمزيد من التفاصيل.' : 'Please check back later for more details.';
  String get chooseYourUnit => isAr ? 'اختر وحدتك' : 'Choose Your Unit';
  String get backToHome => isAr ? 'العودة للرئيسية' : 'Back to Home';

  // Profile
  String get myProfile => isAr ? 'ملفي الشخصي' : 'My Profile';
  String get findoorMember => isAr ? 'عضو فيندور' : 'Findoor Member';
  String get personalInformation => isAr ? 'المعلومات الشخصية' : 'Personal Information';
  String get email => isAr ? 'البريد الإلكتروني' : 'Email';
  String get phone => isAr ? 'الهاتف' : 'Phone';
  String get accountSettings => isAr ? 'إعدادات الحساب' : 'Account Settings';
  String get security => isAr ? 'الأمان' : 'Security';
  String get changePasswordLabel => isAr ? 'تغيير كلمة المرور' : 'Change password';
  String get notifications => isAr ? 'الإشعارات' : 'Notifications';
  String get on => isAr ? 'مفعّل' : 'On';
  String get off => isAr ? 'معطّل' : 'Off';
  String get language => isAr ? 'اللغة' : 'Language';
  String get currentLanguage => isAr ? 'العربية' : 'English';
  String get logoutFromAccount => isAr ? 'تسجيل الخروج من الحساب' : 'Logout from Account';
  String get editProfileTitle => isAr ? 'تعديل الملف الشخصي' : 'Edit Profile';
  String get saveChanges => isAr ? 'حفظ التغييرات' : 'Save Changes';
  String get profileUpdated => isAr ? 'تم تحديث الملف الشخصي' : 'Profile updated';
  String get changePasswordTitle => isAr ? 'تغيير كلمة المرور' : 'Change Password';
  String get currentPassword => isAr ? 'كلمة المرور الحالية' : 'Current Password';
  String get newPassword => isAr ? 'كلمة المرور الجديدة' : 'New Password';
  String get confirmNewPassword => isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password';
  String get updatePassword => isAr ? 'تحديث كلمة المرور' : 'Update Password';
  String get fillAllFields => isAr ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.';
  String get newPasswordsNoMatch => isAr ? 'كلمتا المرور الجديدتان غير متطابقتين.' : 'New passwords do not match.';
  String get passwordTooShort => isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters.';
  String get passwordChangedSuccess => isAr ? 'تم تغيير كلمة المرور بنجاح.' : 'Password changed successfully.';
  String get pushNotifications => isAr ? 'إشعارات الدفع' : 'Push Notifications';
  String get appStatusUpdates => isAr ? 'تحديثات حالة الطلب' : 'Application status updates';
  String get logoutTitle => isAr ? 'تسجيل الخروج' : 'Logout';
  String get logoutConfirm => isAr ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?';
  String get logout => isAr ? 'تسجيل الخروج' : 'Logout';
  String get userFallback => isAr ? 'مستخدم' : 'User';
  String get incorrectCurrentPassword => isAr ? 'كلمة المرور الحالية غير صحيحة.' : 'Incorrect current password.';
  String get couldNotChangePassword => isAr ? 'تعذر تغيير كلمة المرور. حاول مجدداً.' : 'Could not change password. Try again.';

  // Application
  String get housingApplication => isAr ? 'طلب إسكان' : 'Housing Application';
  String get optional => isAr ? '(اختياري)' : '(optional)';
  String get projectDetails => isAr ? 'تفاصيل المشروع' : 'Project Details';
  String get preferredProject => isAr ? 'المشروع المفضل' : 'Preferred Project';
  String get unitType => isAr ? 'نوع الوحدة' : 'Unit Type';
  String get preferredFloor => isAr ? 'الطابق المفضل' : 'Preferred Floor';
  String get groundFloor => isAr ? 'الدور الأرضي' : 'Ground Floor';
  String get typicalFloor => isAr ? 'دور عادي' : 'Typical Floor';
  String get roofFloor => isAr ? 'الدور الأخير' : 'Roof Floor';
  String get paymentPlan => isAr ? 'خطة الدفع' : 'Payment Plan';
  String get cashFull => isAr ? 'دفع كامل (نقداً)' : 'Cash (Full)';
  String get installments5 => isAr ? 'أقساط (5 سنوات)' : 'Installments (5 Years)';
  String get mortgage20 => isAr ? 'رهن عقاري (20 سنة)' : 'Mortgage (20 Years)';
  String get financialStatus => isAr ? 'الحالة المالية' : 'Financial Status';
  String get monthlyIncome => isAr ? 'الدخل الشهري (ج.م)' : 'Monthly Income (EGP)';
  String get familySize => isAr ? 'حجم الأسرة' : 'Family Size';
  String get currentHousingContext => isAr ? 'الوضع السكني الحالي' : 'Current Housing Context';
  String get currentResidence => isAr ? 'مكان الإقامة الحالي' : 'Current Residence';
  String get specialRequirements => isAr ? 'المتطلبات الخاصة' : 'Special Requirements';
  String get verificationDocs => isAr ? 'وثائق التحقق' : 'Verification Documents';
  String get useVaultFaster => isAr ? 'استخدم خزنتك لتسليم أسرع.' : 'Use your vault for faster submission.';
  String get nationalIdCopy => isAr ? 'نسخة الرقم القومي (أمام/خلف)' : 'National ID Copy (Front/Back)';
  String get latestIncomeCert => isAr ? 'آخر شهادة دخل' : 'Latest Income Certificate';
  String get familyStatusDoc => isAr ? 'شهادة الميلاد' : 'Birth Certificate';
  String get backBtn => isAr ? 'رجوع' : 'Back';
  String get continueBtn => isAr ? 'متابعة' : 'Continue';
  String get submitApplication => isAr ? 'تقديم الطلب' : 'Submit Application';
  String get selectProjectMsg => isAr ? 'يرجى اختيار مشروع للمتابعة.' : 'Please select a project to continue.';
  String get projectSoldOutMsg => isAr ? 'هذا المشروع نفدت وحداته. يرجى اختيار مشروع آخر.' : 'This project is sold out. Please select a different project.';
  String get selectUnitType => isAr ? 'يرجى اختيار نوع الوحدة.' : 'Please select a unit type.';
  String get selectPaymentPlan => isAr ? 'يرجى اختيار خطة الدفع.' : 'Please select a payment plan.';
  String get selectProjectFirst => isAr ? 'يرجى اختيار مشروع قبل التقديم.' : 'Please select a project before submitting.';
  String get submissionFailed => isAr ? 'فشل التقديم. يرجى المحاولة مرة أخرى.' : 'Submission failed. Please try again.';
  String get alreadyHasApplication => isAr ? 'لديك بالفعل طلب مقدم. استخدم "حالة طلبي" لتتبعه.' : 'You already have a submitted application. Use "My Status" to track it.';
  String get cannotReachServerConn => isAr ? 'لا يمكن الوصول للخادم. تحقق من اتصالك.' : 'Cannot reach the server. Please check your connection.';
  String get howAddDocument => isAr ? 'كيف تضيف هذا المستند؟' : 'How to add this document?';
  String get uploadFromDevice => isAr ? 'رفع من الجهاز' : 'Upload from Device';
  String get pickPdfOrImage => isAr ? 'اختر أي ملف PDF أو صورة' : 'Pick any PDF or image file';
  String get selectFromVault => isAr ? 'اختر من خزنة المستندات' : 'Select from Documents Vault';
  String get replace => isAr ? 'استبدال' : 'Replace';
  String get select => isAr ? 'اختيار' : 'Select';
  String get soldOut => isAr ? 'نفدت الوحدات' : 'Sold Out';
  String unitsOfTotal(int a, int t) => isAr ? '$a من $t وحدات متاحة' : '$a of $t units available';
  String get noActiveProjects => isAr ? 'لا توجد مشاريع نشطة متاحة حالياً.' : 'No active projects available at this time.';
  String get couldNotOpenFilePicker => isAr ? 'تعذر فتح منتقي الملفات. يرجى المحاولة مرة أخرى.' : 'Could not open file picker. Please try again.';
  String selectedFile(String name) => isAr ? 'تم اختيار $name' : '$name selected';

  // Wallet
  String get housingFees => isAr ? 'رسوم الإسكان' : 'Housing Fees';
  String get amountDue => isAr ? 'المبلغ المستحق' : 'Amount Due';
  String get accountHolder => isAr ? 'صاحب الحساب' : 'Account Holder';
  String get paidSoFar => isAr ? 'المدفوع حتى الآن' : 'Paid So Far';
  String get payNow => isAr ? 'ادفع الآن' : 'Pay Now';
  String get statement => isAr ? 'كشف الحساب' : 'Statement';
  String get support => isAr ? 'الدعم' : 'Support';
  String get noActiveApplication => isAr ? 'لا يوجد طلب نشط' : 'No Active Application';
  String get feeBreakdown => isAr ? 'تفاصيل الرسوم' : 'Fee Breakdown';
  String get noApplicationYet => isAr ? 'لا يوجد طلب حتى الآن' : 'No Application Yet';
  String get submitAppToSeeFees => isAr ? 'قدم طلب إسكان لرؤية تفاصيل الرسوم هنا.' : 'Submit a housing application to see your fee breakdown here.';
  String get appSubmissionFee => isAr ? 'رسوم تقديم الطلب' : 'Application Submission Fee';
  String get processApplicationFeeDesc => isAr ? 'مطلوب لمعالجة طلبك' : 'Required to process your application';
  String get docProcessingFee => isAr ? 'رسوم معالجة الوثائق' : 'Document Processing Fee';
  String get adminDocReview => isAr ? 'مراجعة وثائق إدارية' : 'Administrative document review';
  String get unitReservationDeposit => isAr ? 'وديعة حجز الوحدة' : 'Unit Reservation Deposit';
  String get paid => isAr ? 'مدفوع' : 'Paid';
  String get dueNow => isAr ? 'مستحق الآن' : 'Due Now';
  String get pendingStatus => isAr ? 'قيد الانتظار' : 'Pending';
  String get onlinePayment => isAr ? 'الدفع الإلكتروني' : 'Online Payment';
  String get onlinePaymentSoon => isAr
      ? 'سيكون الدفع الإلكتروني متاحاً قريباً.\n\nيرجى زيارة أقرب مكتب إسكان فيندور للدفع شخصياً.\n\nساعات العمل: الأحد–الخميس، 9:00 ص – 3:00 م'
      : 'Online payment will be available soon.\n\nPlease visit your nearest Findoor Housing Office to pay in person.\n\nOffice hours: Sun–Thu, 9:00 AM – 3:00 PM';
  String get ok => isAr ? 'حسناً' : 'OK';
  String get feeStatement => isAr ? 'كشف الرسوم' : 'Fee Statement';
  String get applicationFeeLabel => isAr ? 'رسوم الطلب' : 'Application Fee';
  String get processingFeeLabel => isAr ? 'رسوم المعالجة' : 'Processing Fee';
  String get depositDue => isAr ? 'الوديعة المستحقة' : 'Deposit Due';
  String get statusLabel => isAr ? 'الحالة' : 'Status';
  String get projectLabel => isAr ? 'المشروع' : 'Project';
  String get close => isAr ? 'إغلاق' : 'Close';
  String get noApplicationOnFile => isAr ? 'لا يوجد طلب مسجل بعد.' : 'No application on file yet.';
  String get paymentSupport => isAr ? 'دعم الدفع' : 'Payment Support';
  String get callFinanceOffice => isAr ? 'الاتصال بمكتب المالية' : 'Call Finance Office';
  String get emailSupportLabel => isAr ? 'دعم البريد الإلكتروني' : 'Email Support';

  // Documents Vault
  String get secureDocumentsVault => isAr ? 'خزنة المستندات الآمنة' : 'Secure Documents Vault';
  String filesSecured(int n, int t) => isAr ? '$n من $t ملفات مؤمنة' : '$n of $t files secured';
  String get uploaded => isAr ? 'مرفوع' : 'Uploaded';
  String get missing => isAr ? 'ناقص' : 'Missing';
  String get yourPaperwork => isAr ? 'مستنداتك' : 'Your Paperwork';
  String get verifiedFile => isAr ? 'ملف محقق' : 'Verified File';
  String get waitingForUpload => isAr ? 'في انتظار الرفع' : 'Waiting for upload';
  String get fileName => isAr ? 'اسم الملف' : 'File Name';
  String get sizeLabel => isAr ? 'الحجم' : 'Size';
  String get dateLabel => isAr ? 'التاريخ' : 'Date';
  String get view => isAr ? 'عرض' : 'View';
  String get delete => isAr ? 'حذف' : 'Delete';
  String get removeDocument => isAr ? 'حذف المستند' : 'Remove Document';
  String removeDocConfirm(String doc) => isAr
      ? 'إزالة "$doc" من خزنتك؟ لا يمكن التراجع عن هذا.'
      : 'Remove "$doc" from your vault? This cannot be undone.';
  String get remove => isAr ? 'حذف' : 'Remove';
  String addedToVault(String name) => isAr ? '$name تمت الإضافة لخزنتك' : '$name added to your vault';
  String removedFromVault(String doc) => isAr ? 'تم حذف $doc' : '$doc removed';
  String get couldNotOpenGallery => isAr ? 'تعذر فتح المعرض. يرجى المحاولة مرة أخرى.' : 'Could not open gallery. Please try again.';
  String get pdfPreviewNotAvailable => isAr ? 'معاينة PDF غير متاحة في التطبيق.' : 'PDF preview not available in-app.';
  String get securityNote => isAr
      ? 'ملفاتك مشفرة ولا يمكن الاطلاع عليها إلا من قِبل ضباط الإسكان المعتمدين خلال الطلبات النشطة.'
      : 'Your files are encrypted and only visible to authorized housing officers during active applications.';
  String get scanWithOcrDesc => isAr
      ? 'مسح بالـ OCR لاستخراج بياناتك تلقائياً، أو ارفع صورة.'
      : 'Scan with OCR to auto-extract your details, or upload a photo.';
  String get uploadPhotoBack => isAr ? 'ارفع صورة لظهر بطاقتك القومية.' : 'Upload a photo of the back of your National ID.';
  String get scanWithNidScanner => isAr ? 'مسح بماسح الهوية' : 'Scan with NID Scanner';
  String get autoReadCard => isAr ? 'قراءة تلقائية لبطاقتك باستخدام OCR' : 'Auto-read your card using OCR';
  String get uploadFromGallery => isAr ? 'رفع من المعرض' : 'Upload from Gallery';
  String get chooseExistingPhoto => isAr ? 'اختر صورة موجودة من جهازك' : 'Choose an existing photo from your device';
  String get scanUpload => isAr ? 'مسح / رفع' : 'Scan / Upload';
  String get uploadNow => isAr ? 'ارفع الآن' : 'Upload Now';
  String addDoc(String docType) => isAr ? 'إضافة $docType' : 'Add $docType';

  // Projects page
  String get majorProjects => isAr ? 'المشاريع الكبرى' : 'Major Projects';
  String get searchProjects => isAr ? 'ابحث في المشاريع...' : 'Search projects…';
  String noProjectsMatch(String q) => isAr ? 'لا توجد مشاريع تطابق "$q"' : 'No projects match "$q"';
  String get viewDetails => isAr ? 'عرض التفاصيل' : 'View Details';
  String get connectionNetworkError => isAr
      ? 'خطأ في الاتصال. تأكد من أن جهازك والحاسوب على نفس الشبكة.'
      : 'Connection error. Make sure your laptop and phone are on the same Wi-Fi.';
  String get statusActive => isAr ? 'نشط' : 'ACTIVE';
  String get statusPlanning => isAr ? 'قيد التخطيط' : 'PLANNING';
  String get statusCompleted => isAr ? 'مكتمل' : 'COMPLETED';
  String get allDocumentsRequired => isAr ? 'يرجى إرفاق جميع المستندات المطلوبة.' : 'Please attach all required documents.';
  String get unitsSlashTotal => isAr ? 'وحدة' : 'Units';

  // Chatbot
  String get typeMessage => isAr ? 'اكتب رسالتك...' : 'Type your message...';
  String get smartAssistantLabel => isAr ? 'المساعد العقاري الذكي' : 'Smart Real Estate Assistant';
  String get connectionError => isAr
      ? 'عذراً، حدث خطأ في الاتصال بالخادم.\nتأكد من تشغيل الخادم على المنفذ 5000.'
      : 'Sorry, a connection error occurred.\nEnsure the server is running on port 5000.';
  String get noReply => isAr ? 'لم أستطع الحصول على رد.' : 'Could not get a response.';
}

class LangToggleButton extends StatelessWidget {
  const LangToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final isAr = context.watch<LangNotifier>().isAr;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => context.read<LangNotifier>().toggle(),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF1E88E5), width: 1.5),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            isAr ? 'EN' : 'عربي',
            style: const TextStyle(
              color: Color(0xFF1E88E5),
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
