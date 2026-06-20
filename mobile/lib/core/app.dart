import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'page_tracker.dart';
import 'lang.dart';
import 'api_config.dart';
import '../features/splash/splash_screen.dart';

class FindoorApp extends StatelessWidget {
  const FindoorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LangNotifier(),
      child: Consumer<LangNotifier>(
        builder: (_, lang, __) => MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Findoor',
          theme: AppTheme.lightTheme,
          navigatorKey: ApiConfig.navigatorKey,
          navigatorObservers: [pageRouteObserver],
          locale: lang.isAr ? const Locale('ar') : const Locale('en'),
          home: const SplashScreen(),
        ),
      ),
    );
  }
}
