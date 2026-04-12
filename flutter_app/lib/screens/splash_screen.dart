import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _logoCtrl;
  late final AnimationController _textCtrl;
  late final AnimationController _dotsCtrl;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _textFade;
  late final Animation<Offset> _textSlide;
  late final Animation<double> _taglineFade;

  @override
  void initState() {
    super.initState();
    _logoCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _textCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _dotsCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat();

    _logoScale = Tween<double>(begin: 0.3, end: 1.0).animate(
        CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoFade = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _logoCtrl, curve: const Interval(0, 0.4)));
    _textFade = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));
    _textSlide =
        Tween<Offset>(begin: const Offset(0, 0.25), end: Offset.zero).animate(
            CurvedAnimation(parent: _textCtrl, curve: Curves.easeOutCubic));
    _taglineFade = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(
            parent: _textCtrl, curve: const Interval(0.5, 1.0)));

    _logoCtrl.forward().then((_) => _textCtrl.forward());
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2800));
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      auth.loadUser();
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    _dotsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF052e16),
              Color(0xFF14532d),
              Color(0xFF166534),
              Color(0xFF16803d),
            ],
            stops: [0.0, 0.35, 0.7, 1.0],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // decorative blobs
              Positioned(
                top: -60, right: -60,
                child: _Blob(size: 240, opacity: 0.04, color: Colors.white),
              ),
              Positioned(
                bottom: 100, left: -80,
                child: _Blob(
                    size: 260,
                    opacity: 0.07,
                    color: const Color(0xFF4ade80)),
              ),
              Positioned(
                bottom: -30, right: 40,
                child: _Blob(size: 140, opacity: 0.03, color: Colors.white),
              ),

              // centre content
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo
                    ScaleTransition(
                      scale: _logoScale,
                      child: FadeTransition(
                        opacity: _logoFade,
                        child: Container(
                          width: 136,
                          height: 136,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF4ade80)
                                    .withOpacity(0.40),
                                blurRadius: 52,
                                spreadRadius: 10,
                              ),
                              BoxShadow(
                                color: Colors.black.withOpacity(0.22),
                                blurRadius: 28,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.eco_rounded,
                            size: 78,
                            color: Color(0xFF16a34a),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 36),

                    // App name
                    SlideTransition(
                      position: _textSlide,
                      child: FadeTransition(
                        opacity: _textFade,
                        child: Text(
                          'CottonCare AI',
                          style: GoogleFonts.poppins(
                            fontSize: 36,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Tagline
                    FadeTransition(
                      opacity: _taglineFade,
                      child: Text(
                        'Smart Cotton Disease Detection',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.70),
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Pulse dots
              Positioned(
                bottom: 52, left: 0, right: 0,
                child: FadeTransition(
                  opacity: _textFade,
                  child: _PulseDots(controller: _dotsCtrl),
                ),
              ),

              // Version
              Positioned(
                bottom: 22, left: 0, right: 0,
                child: FadeTransition(
                  opacity: _taglineFade,
                  child: Text(
                    'v1.0.0',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.35),
                      fontSize: 11,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double size, opacity;
  final Color color;
  const _Blob(
      {required this.size,
      required this.opacity,
      required this.color});
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color.withOpacity(opacity),
        ),
      );
}

class _PulseDots extends StatelessWidget {
  final AnimationController controller;
  const _PulseDots({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: controller,
          builder: (_, __) {
            final v = controller.value;
            final opacity =
                (math.sin((v - i * 0.18) * math.pi * 2) * 0.5 + 0.5)
                    .clamp(0.25, 1.0);
            final sz = 6.0 + opacity * 3;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 5),
              width: sz,
              height: sz,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(opacity),
              ),
            );
          },
        );
      }),
    );
  }
}
