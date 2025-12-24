import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/results_screen.dart';
import 'screens/history_screen.dart';
import 'utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CottonCareApp());
}

class CottonCareApp extends StatelessWidget {
  const CottonCareApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Add providers here (API, Storage, Auth, etc.)
      ],
      child: MaterialApp(
        title: 'CottonCare AI',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const SplashScreen(),
        routes: {
          '/splash': (context) => const SplashScreen(),
          '/login': (context) => const LoginScreen(),
          '/home': (context) => const HomeScreen(),
          '/camera': (context) => const CameraScreen(),
          '/results': (context) => const ResultsScreen(),
          '/history': (context) => const HistoryScreen(),
        },
      ),
    );
  }
}
