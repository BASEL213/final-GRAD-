import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Add to MaterialApp.navigatorObservers
final RouteObserver<PageRoute<dynamic>> pageRouteObserver =
    RouteObserver<PageRoute<dynamic>>();

/// Mix into any State class to persist the current page across restarts.
///
/// Usage:
///   class _MyScreenState extends State<MyScreen> with PageTracker<MyScreen> {
///     @override String get trackedPage => 'my_screen';
///   }
mixin PageTracker<T extends StatefulWidget> on State<T> implements RouteAware {
  String get trackedPage;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route is PageRoute) {
      pageRouteObserver.subscribe(this, route);
    }
  }

  @override
  void dispose() {
    pageRouteObserver.unsubscribe(this);
    super.dispose();
  }

  void _save() => SharedPreferences.getInstance()
      .then((p) => p.setString('current_page', trackedPage));

  @override
  void didPush() => _save();

  @override
  void didPopNext() => _save();

  @override
  void didPop() {}

  @override
  void didPushNext() {}
}
