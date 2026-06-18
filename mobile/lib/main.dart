import 'package:flutter/material.dart';
import 'core/api_config.dart';
import 'core/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();
  runApp(const FindoorApp());
}
