import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../services/camera_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});
  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with SingleTickerProviderStateMixin {
  final _cameraService = CameraService();
  XFile? _imageFile;
  Uint8List? _imageBytes;
  bool _analyzing = false;
  String? _error;

  // GPS
  Position? _currentPosition;
  String _locationStatus = 'pending'; // pending | granted | denied | unavailable

  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.06).animate(
        CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    if (!kIsWeb) _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _locationStatus = 'unavailable');
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() => _locationStatus = 'denied');
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (mounted) {
        setState(() {
          _currentPosition = pos;
          _locationStatus = 'granted';
        });
      }
    } catch (_) {
      if (mounted) setState(() => _locationStatus = 'denied');
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _pick(bool fromCamera) async {
    final XFile? file = fromCamera
        ? await _cameraService.captureImage()
        : await _cameraService.pickImageFromGallery();
    if (file == null) return;
    final Uint8List? bytes = kIsWeb ? await file.readAsBytes() : null;
    setState(() {
      _imageFile = file;
      _imageBytes = bytes;
      _error = null;
    });
  }

  Future<void> _analyze() async {
    if (_imageFile == null) return;
    setState(() {
      _analyzing = true;
      _error = null;
    });
    // Refresh GPS fix before analysis
    if (!kIsWeb && _locationStatus == 'granted') {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        setState(() => _currentPosition = pos);
      } catch (_) {}
    }
    try {
      final pos = _currentPosition;
      final result = await ApiService.instance.analyzeImage(
        _imageFile!,
        latitude: pos?.latitude,
        longitude: pos?.longitude,
        locationAccuracy: pos?.accuracy,
      );
      if (mounted) {
        Navigator.pushNamed(context, '/results', arguments: result);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _analyzing = false;
        });
      }
    }
  }

  Widget _buildPreview() {
    if (kIsWeb && _imageBytes != null) {
      return Image.memory(_imageBytes!, fit: BoxFit.cover);
    }
    if (!kIsWeb && _imageFile != null) {
      return _NativeFileImage(path: _imageFile!.path);
    }
    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF9),
      body: CustomScrollView(
        slivers: [
          // ── App bar ──────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 100,
            floating: true,
            pinned: true,
            backgroundColor: const Color(0xFF14532d),
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                'Scan Cotton Leaf',
                style: GoogleFonts.poppins(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF14532d), Color(0xFF16a34a)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Scan area ──────────────────────────────────────
                AspectRatio(
                  aspectRatio: 1,
                  child: GestureDetector(
                    onTap: () => _pick(false),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Background / image
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          decoration: BoxDecoration(
                            color: _imageFile != null
                                ? Colors.black
                                : const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: _imageFile != null
                                  ? const Color(0xFF16a34a)
                                  : const Color(0xFFBBF7D0),
                              width: 2,
                            ),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _imageFile != null
                              ? _buildPreview()
                              : Column(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    ScaleTransition(
                                      scale: _pulseAnim,
                                      child: Container(
                                        width: 80,
                                        height: 80,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF16a34a)
                                              .withOpacity(0.12),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.add_photo_alternate_outlined,
                                          size: 40,
                                          color: Color(0xFF16a34a),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Tap to select image',
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF16a34a),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      'or use the buttons below',
                                      style: TextStyle(
                                          color: Color(0xFF6B7280),
                                          fontSize: 13),
                                    ),
                                  ],
                                ),
                        ),

                        // Corner brackets (always visible over image)
                        if (_imageFile == null)
                          ..._buildBrackets(),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // ── Location status chip ───────────────────────────
                if (!kIsWeb)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: _locationStatus == 'granted'
                          ? const Color(0xFFDCFCE7)
                          : const Color(0xFFFEF9C3),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: _locationStatus == 'granted'
                            ? const Color(0xFF86EFAC)
                            : const Color(0xFFFDE047),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _locationStatus == 'granted'
                              ? Icons.location_on_rounded
                              : _locationStatus == 'pending'
                                  ? Icons.location_searching_rounded
                                  : Icons.location_off_rounded,
                          size: 14,
                          color: _locationStatus == 'granted'
                              ? const Color(0xFF16a34a)
                              : const Color(0xFFCA8A04),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _locationStatus == 'granted' && _currentPosition != null
                              ? '${_currentPosition!.latitude.toStringAsFixed(5)}, '
                                '${_currentPosition!.longitude.toStringAsFixed(5)} '
                                '(±${_currentPosition!.accuracy.round()}m)'
                              : _locationStatus == 'pending'
                                  ? 'Getting location…'
                                  : 'Location not available',
                          style: TextStyle(
                            fontSize: 11,
                            color: _locationStatus == 'granted'
                                ? const Color(0xFF15803d)
                                : const Color(0xFF854D0E),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 12),

                // ── Pick buttons ───────────────────────────────────
                Row(
                  children: [
                    Expanded(
                      child: _PickButton(
                        icon: Icons.camera_alt_outlined,
                        label: 'Camera',
                        onTap: _analyzing ? null : () => _pick(true),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _PickButton(
                        icon: Icons.photo_library_outlined,
                        label: 'Gallery',
                        onTap: _analyzing ? null : () => _pick(false),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // ── Analyze button ─────────────────────────────────
                SizedBox(
                  height: 56,
                  child: Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    child: Ink(
                      decoration: BoxDecoration(
                        gradient: _imageFile != null && !_analyzing
                            ? const LinearGradient(
                                colors: [
                                  Color(0xFF15803d),
                                  Color(0xFF16a34a)
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              )
                            : const LinearGradient(colors: [
                                Color(0xFFD1D5DB),
                                Color(0xFFD1D5DB)
                              ]),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: _imageFile != null && !_analyzing
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF16a34a)
                                      .withOpacity(0.40),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : null,
                      ),
                      child: InkWell(
                        onTap: (_imageFile != null && !_analyzing)
                            ? _analyze
                            : null,
                        borderRadius: BorderRadius.circular(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (_analyzing)
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.5),
                              )
                            else
                              const Icon(Icons.biotech_rounded,
                                  color: Colors.white, size: 22),
                            const SizedBox(width: 10),
                            Text(
                              _analyzing
                                  ? 'Analyzing...'
                                  : 'Analyze Leaf',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // ── Error card ─────────────────────────────────────
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.error_outline_rounded,
                          color: Color(0xFFEF4444), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                          child: Text(_error!,
                              style: const TextStyle(
                                  color: Color(0xFFDC2626),
                                  fontSize: 13))),
                    ]),
                  ),
                ],

                const SizedBox(height: 24),

                // ── Tips card ──────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.tips_and_updates_rounded,
                            color: Color(0xFF16a34a), size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Tips for best results',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: const Color(0xFF15803d),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 10),
                      const _Tip(text: 'Ensure good lighting on the leaf'),
                      const _Tip(
                          text: 'Focus on the affected / discolored area'),
                      const _Tip(
                          text: 'Keep the leaf flat and wrinkle-free'),
                      const _Tip(
                          text: 'Use a plain background when possible'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildBrackets() {
    const color = Color(0xFF16a34a);
    const len = 28.0;
    const thick = 3.0;
    const r = 6.0;
    Widget corner(AlignmentGeometry align, bool flipH, bool flipV) {
      return Align(
        alignment: align,
        child: Container(
          margin: const EdgeInsets.all(14),
          width: len,
          height: len,
          decoration: BoxDecoration(
            border: Border(
              top: flipV
                  ? BorderSide.none
                  : const BorderSide(color: color, width: thick),
              bottom: flipV
                  ? const BorderSide(color: color, width: thick)
                  : BorderSide.none,
              left: flipH
                  ? BorderSide.none
                  : const BorderSide(color: color, width: thick),
              right: flipH
                  ? const BorderSide(color: color, width: thick)
                  : BorderSide.none,
            ),
            borderRadius: BorderRadius.only(
              topLeft: (!flipH && !flipV) ? const Radius.circular(r) : Radius.zero,
              topRight: (flipH && !flipV) ? const Radius.circular(r) : Radius.zero,
              bottomLeft: (!flipH && flipV) ? const Radius.circular(r) : Radius.zero,
              bottomRight: (flipH && flipV) ? const Radius.circular(r) : Radius.zero,
            ),
          ),
        ),
      );
    }

    return [
      corner(Alignment.topLeft, false, false),
      corner(Alignment.topRight, true, false),
      corner(Alignment.bottomLeft, false, true),
      corner(Alignment.bottomRight, true, true),
    ];
  }
}

class _PickButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _PickButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon,
            color: onTap != null ? const Color(0xFF16a34a) : Colors.grey,
            size: 20),
        label: Text(
          label,
          style: TextStyle(
            color: onTap != null ? const Color(0xFF16a34a) : Colors.grey,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: onTap != null
                ? const Color(0xFF16a34a)
                : Colors.grey.shade300,
          ),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
          backgroundColor: const Color(0xFFF8FAF9),
        ),
      ),
    );
  }
}

class _Tip extends StatelessWidget {
  final String text;
  const _Tip({required this.text});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        const Icon(Icons.check_circle_rounded,
            size: 15, color: Color(0xFF16a34a)),
        const SizedBox(width: 8),
        Expanded(
            child: Text(text,
                style: const TextStyle(
                    fontSize: 13, color: Color(0xFF374151)))),
      ]),
    );
  }
}

// Native-only image widget
class _NativeFileImage extends StatelessWidget {
  final String path;
  const _NativeFileImage({required this.path});
  @override
  Widget build(BuildContext context) {
    return Image.network(
      'file://$path',
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => const Center(
        child: Icon(Icons.broken_image_rounded,
            color: Colors.grey, size: 48),
      ),
    );
  }
}
