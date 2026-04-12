import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({super.key});

  Color _severityColor(String? level) {
    switch ((level ?? '').toLowerCase()) {
      case 'mild':     return const Color(0xFF84cc16);
      case 'moderate': return const Color(0xFFf59e0b);
      case 'severe':   return const Color(0xFFef4444);
      case 'critical': return const Color(0xFF7c3aed);
      default:         return const Color(0xFF6b7280);
    }
  }

  IconData _severityIcon(String? level) {
    switch ((level ?? '').toLowerCase()) {
      case 'mild':     return Icons.check_circle_rounded;
      case 'moderate': return Icons.warning_rounded;
      case 'severe':   return Icons.dangerous_rounded;
      case 'critical': return Icons.emergency_rounded;
      default:         return Icons.help_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    final Map<String, dynamic> data =
        args is Map<String, dynamic> ? args : {};

    final analysis   = data['analysis'] as Map<String, dynamic>? ?? {};
    final severity    = analysis['severity']  as Map<String, dynamic>? ?? {};
    final lesions     = analysis['lesion_analysis'] as Map<String, dynamic>? ?? {};
    final treatment   = analysis['treatment'] as Map<String, dynamic>?;
    final nutrient    = analysis['nutrient_deficiency'] as Map<String, dynamic>?;

    final disease      = analysis['disease'] as String? ?? 'Unknown';
    // API may return these as String on some builds — safe-parse
    final _confPctRaw  = analysis['confidence_percentage'];
    final confPct      = _confPctRaw is num ? _confPctRaw : num.tryParse(_confPctRaw?.toString() ?? '') ?? 0;
    final _confRaw     = analysis['confidence'];
    final conf         = _confRaw is num ? _confRaw : num.tryParse(_confRaw?.toString() ?? '') ?? 0;
    final _areaRaw     = analysis['affected_area'];
    final affectedArea = _areaRaw is num ? _areaRaw : num.tryParse(_areaRaw?.toString() ?? '') ?? 0;
    final sevLevel     = severity['level'] as String? ?? 'Unknown';
    final sevReasoning = severity['reasoning'] as String? ?? '';
    final lesionCount  = lesions['count'] as int? ?? 0;
    final gradCamOverlay = analysis['grad_cam_overlay'] as String?;
    final gradCamHeatmap = analysis['grad_cam_heatmap'] as String?;

    final isHealthy = disease.toLowerCase().contains('healthy');
    final sevColor = isHealthy ? const Color(0xFF22c55e) : _severityColor(sevLevel);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF9),
      body: CustomScrollView(
        slivers: [
          // ── Full-bleed coloured header ──────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: sevColor,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      sevColor.withOpacity(0.9),
                      sevColor,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 48, 20, 16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          width: 68,
                          height: 68,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.2),
                          ),
                          child: Icon(
                            _severityIcon(isHealthy ? 'low' : sevLevel),
                            size: 38,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          disease,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: Colors.white.withOpacity(0.5)),
                          ),
                          child: Text(
                            isHealthy ? 'Healthy' : '$sevLevel Severity',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Metrics row
                Row(
              children: [
                Expanded(
                    child: _MetricCard(
                        label: 'Confidence',
                        value: '${confPct.toStringAsFixed(1)}%',
                        icon: Icons.analytics_rounded,
                        color: const Color(0xFF6366f1),
                        progress: conf.toDouble())),
                const SizedBox(width: 12),
                Expanded(
                    child: _MetricCard(
                        label: 'Affected Area',
                        value: '${affectedArea.toStringAsFixed(1)}%',
                        icon: Icons.area_chart_rounded,
                        color: const Color(0xFFf59e0b),
                        progress: affectedArea.toDouble() / 100)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                    child: _MetricCard(
                        label: 'Lesion Count',
                        value: lesionCount.toString(),
                        icon: Icons.bubble_chart_rounded,
                        color: const Color(0xFFef4444))),
                const SizedBox(width: 12),
                Expanded(
                    child: _MetricCard(
                        label: 'Severity Score',
                        value: (severity['score'] as num? ?? 0)
                            .toStringAsFixed(2),
                        icon: Icons.speed_rounded,
                        color: sevColor)),
              ],
            ),

            if (sevReasoning.isNotEmpty) ...[
              const SizedBox(height: 16),
              _InfoCard(
                title: 'Analysis Reasoning',
                icon: Icons.lightbulb_outline_rounded,
                child: Text(sevReasoning,
                    style: const TextStyle(
                        fontSize: 13, color: Color(0xFF374151), height: 1.5)),
              ),
            ],

            if ((severity['indicators'] as Map?)?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              _InfoCard(
                title: 'Indicators Detected',
                icon: Icons.list_alt_rounded,
                child: Column(
                    children: (severity['indicators'] as Map)
                        .entries
                        .map((e) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(children: [
                                const Icon(Icons.circle,
                                    size: 6, color: Color(0xFF16a34a)),
                                const SizedBox(width: 8),
                                Expanded(
                                    child: Text(
                                        '${e.key}: ${e.value}',
                                        style: const TextStyle(fontSize: 13))),
                              ]),
                            ))
                        .toList()),
              ),
            ],

            // ── XAI Visualizations ──────────────────────────────────────
            if (!isHealthy && (gradCamOverlay != null || gradCamHeatmap != null)) ...[              
              const SizedBox(height: 16),
              _XaiCard(
                overlayBase64: gradCamOverlay,
                heatmapBase64: gradCamHeatmap,
              ),
            ],

            // ── Treatment Plan ──────────────────────────────────────────
            if (treatment != null && !isHealthy) ...[                
              const SizedBox(height: 16),
              _TreatmentCard(treatment: treatment, sevColor: sevColor),
            ],

            // ── Nutrient Deficiency ─────────────────────────────────────
            if (nutrient != null && !isHealthy) ...[                
              const SizedBox(height: 16),
              _NutrientCard(nutrient: nutrient),
            ],

            const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: const Text('Scan Another Leaf',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16a34a),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final double? progress;
  const _MetricCard(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color,
      this.progress});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: color.withAlpha(30),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ]),
          const SizedBox(height: 8),
          Text(value,
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          if (progress != null) ...[
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: progress!.clamp(0.0, 1.0),
                minHeight: 4,
                backgroundColor: color.withAlpha(30),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;
  const _InfoCard(
      {required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withAlpha(12),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: const Color(0xFF16a34a), size: 18),
          const SizedBox(width: 8),
          Text(title,
              style:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        ]),
        const SizedBox(height: 10),
        child,
      ]),
    );
  }
}

// ── XAI Visualizations card ───────────────────────────────────────────────────

class _XaiCard extends StatefulWidget {
  final String? overlayBase64;
  final String? heatmapBase64;
  const _XaiCard({this.overlayBase64, this.heatmapBase64});

  @override
  State<_XaiCard> createState() => _XaiCardState();
}

class _XaiCardState extends State<_XaiCard> {
  // 0 = overlay, 1 = heatmap
  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    final hasOverlay = widget.overlayBase64 != null;
    final hasHeatmap = widget.heatmapBase64 != null;
    final activeUri = _selected == 0
        ? widget.overlayBase64
        : widget.heatmapBase64;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withAlpha(12),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF0FDF4),
              borderRadius:
                  BorderRadius.vertical(top: Radius.circular(14)),
              border: Border(
                  bottom: BorderSide(color: Color(0xFFBBF7D0))),
            ),
            child: Row(children: [
              const Icon(Icons.biotech_rounded,
                  color: Color(0xFF16a34a), size: 18),
              const SizedBox(width: 8),
              const Expanded(
                  child: Text('XAI Analysis',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14))),
              const Text('Grad-CAM Visualization',
                  style: TextStyle(
                      fontSize: 11, color: Color(0xFF6B7280))),
            ]),
          ),

          // Tab toggle
          if (hasOverlay && hasHeatmap)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(children: [
                _XaiTab(
                  label: 'Overlay',
                  icon: Icons.layers_rounded,
                  selected: _selected == 0,
                  onTap: () => setState(() => _selected = 0),
                ),
                const SizedBox(width: 8),
                _XaiTab(
                  label: 'Heatmap',
                  icon: Icons.thermostat_rounded,
                  selected: _selected == 1,
                  onTap: () => setState(() => _selected = 1),
                ),
              ]),
            ),

          // Image
          if (activeUri != null)
            Padding(
              padding: const EdgeInsets.all(14),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: _Base64Image(dataUri: activeUri),
              ),
            ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: Text(
              _selected == 0
                  ? 'Grad-CAM overlay highlights the regions the model focused on most to make its prediction.'
                  : 'Pure heatmap showing activation intensity across the leaf (red = high attention).',
              style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF6B7280),
                  height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _Base64Image extends StatelessWidget {
  final String dataUri;
  const _Base64Image({required this.dataUri});

  @override
  Widget build(BuildContext context) {
    try {
      // Strip "data:image/png;base64," prefix if present
      final comma = dataUri.indexOf(',');
      final b64 = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
      final bytes = base64Decode(b64);
      return Image.memory(bytes, fit: BoxFit.contain);
    } catch (_) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Could not decode image',
              style: TextStyle(color: Colors.grey)),
        ),
      );
    }
  }
}

class _XaiTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _XaiTab(
      {required this.label,
      required this.icon,
      required this.selected,
      required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: selected
                ? const Color(0xFF16a34a)
                : const Color(0xFFF8FAF9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: selected
                  ? const Color(0xFF16a34a)
                  : const Color(0xFFE5E7EB),
            ),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon,
                size: 14,
                color: selected ? Colors.white : const Color(0xFF6B7280)),
            const SizedBox(width: 5),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: selected ? Colors.white : const Color(0xFF6B7280))),
          ]),
        ),
      );
}

// ── Treatment Plan card ───────────────────────────────────────────────────────

class _TreatmentCard extends StatelessWidget {
  final Map<String, dynamic> treatment;
  final Color sevColor;
  const _TreatmentCard({required this.treatment, required this.sevColor});

  @override
  Widget build(BuildContext context) {
    final chem      = treatment['chemical']  as Map<String, dynamic>?;
    final org       = treatment['organic']   as Map<String, dynamic>?;
    final cultural  = (treatment['cultural'] as List?)?.cast<String>() ?? [];
    final preventive = (treatment['preventive_measures'] as List?)?.cast<String>() ?? [];
    final urgency   = treatment['urgency']   as String? ?? '';
    final recovery  = treatment['estimated_recovery_days'] as String? ?? '';
    final planDesc  = treatment['plan_description'] as String? ?? '';
    final severity  = treatment['severity']  as String? ?? '';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(12), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: sevColor.withAlpha(20),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
              border: Border(bottom: BorderSide(color: sevColor.withAlpha(50))),
            ),
            child: Row(children: [
              Icon(Icons.medical_services_rounded, color: sevColor, size: 18),
              const SizedBox(width: 8),
              const Expanded(child: Text('Treatment Plan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
              if (severity.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: sevColor, borderRadius: BorderRadius.circular(20)),
                  child: Text(severity, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Urgency + Recovery chips
              Row(children: [
                Expanded(child: _TxChip(icon: Icons.bolt_rounded, label: 'Urgency', value: urgency, bg: const Color(0xFFFFFBEB), border: const Color(0xFFFDE68A))),
                const SizedBox(width: 10),
                Expanded(child: _TxChip(icon: Icons.calendar_month_rounded, label: 'Recovery', value: recovery)),
              ]),
              if (planDesc.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(8)),
                  child: Text(planDesc, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.5)),
                ),
              ],
              // Chemical
              const SizedBox(height: 14),
              const _TxSectionTitle(label: '🧪 Chemical Treatment', color: Color(0xFFEF4444)),
              if (chem != null) ...[
                _TxDrugRow(tag: 'Primary', data: chem['primary'] as Map?),
                _TxDrugRow(tag: 'Alternative', data: chem['alternative'] as Map?),
                if (chem['application'] != null) _TxNote(chem['application'] as String),
                if (chem['safety'] != null) _TxNote(chem['safety'] as String, isWarning: true),
              ] else
                const Padding(
                  padding: EdgeInsets.only(top: 4),
                  child: Text('No chemical intervention required at this severity level.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ),
              // Organic
              const SizedBox(height: 14),
              const _TxSectionTitle(label: '🌿 Organic Treatment', color: Color(0xFF22C55E)),
              if (org != null) ...[
                _TxDrugRow(tag: 'Primary', data: org['primary'] as Map?),
                _TxDrugRow(tag: 'Alternative', data: org['alternative'] as Map?),
                if (org['note']          != null) _TxNote(org['note'] as String),
                if (org['effectiveness'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text('Effectiveness: ${org['effectiveness']}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF15803D), fontWeight: FontWeight.w600)),
                  ),
              ],
              // Cultural
              if (cultural.isNotEmpty) ...[
                const SizedBox(height: 14),
                const _TxSectionTitle(label: '🌾 Cultural / IPM Measures', color: Color(0xFF6366F1)),
                ..._bulletList(cultural),
              ],
              // Preventive
              if (preventive.isNotEmpty) ...[
                const SizedBox(height: 14),
                const _TxSectionTitle(label: '🛡️ Preventive Measures', color: Color(0xFFF59E0B)),
                ..._bulletList(preventive),
              ],
            ]),
          ),
        ],
      ),
    );
  }

  List<Widget> _bulletList(List<String> items) => items.map((s) => Padding(
    padding: const EdgeInsets.only(top: 4),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.only(top: 5), child: Icon(Icons.circle, size: 5, color: Color(0xFF16a34a))),
      const SizedBox(width: 8),
      Expanded(child: Text(s, style: const TextStyle(fontSize: 12, color: Color(0xFF374151), height: 1.5))),
    ]),
  )).toList();
}

class _TxChip extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color? bg, border;
  const _TxChip({required this.icon, required this.label, required this.value, this.bg, this.border});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: bg ?? const Color(0xFFF8FAFC),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: border ?? const Color(0xFFE2E8F0)),
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 16, color: const Color(0xFF16a34a)),
      const SizedBox(width: 8),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600, letterSpacing: 0.3)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.4)),
      ])),
    ]),
  );
}

class _TxSectionTitle extends StatelessWidget {
  final String label;
  final Color color;
  const _TxSectionTitle({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.only(left: 8),
    decoration: BoxDecoration(border: Border(left: BorderSide(color: color, width: 3))),
    child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0.3)),
  );
}

class _TxDrugRow extends StatelessWidget {
  final String tag;
  final Map? data;
  const _TxDrugRow({required this.tag, this.data});

  @override
  Widget build(BuildContext context) {
    if (data == null || data!['name'] == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          margin: const EdgeInsets.only(top: 1),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: tag == 'Primary' ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(tag,
              style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: tag == 'Primary' ? const Color(0xFF15803D) : const Color(0xFF64748B))),
        ),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(data!['name'] as String, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          if (data!['dosage'] != null)
            Text('Dosage: ${data!['dosage']}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          if (data!['frequency'] != null)
            Text('Frequency: ${data!['frequency']}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          if (data!['cost'] != null)
            Text(data!['cost'] as String, style: const TextStyle(fontSize: 11, color: Color(0xFF16a34a), fontWeight: FontWeight.w600)),
        ])),
      ]),
    );
  }
}

class _TxNote extends StatelessWidget {
  final String text;
  final bool isWarning;
  const _TxNote(this.text, {this.isWarning = false});

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(top: 6),
    padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(
      color: isWarning ? const Color(0xFFFFF7ED) : const Color(0xFFF8FAFC),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(isWarning ? '⚠️' : '📋', style: const TextStyle(fontSize: 12)),
      const SizedBox(width: 6),
      Expanded(child: Text(text, style: TextStyle(fontSize: 11, color: isWarning ? const Color(0xFF92400E) : const Color(0xFF64748B), height: 1.5))),
    ]),
  );
}

// ── Nutrient Deficiency card ──────────────────────────────────────────────────

class _NutrientCard extends StatelessWidget {
  final Map<String, dynamic> nutrient;
  const _NutrientCard({required this.nutrient});

  @override
  Widget build(BuildContext context) {
    final deficiency    = nutrient['deficiency'] as String? ?? '';
    final hasDeficiency = deficiency.isNotEmpty && deficiency != 'No deficiency detected';
    final confidence    = nutrient['confidence']  as num?     ?? 0;
    final symptoms      = (nutrient['symptoms_detected'] as List?)?.cast<String>() ?? [];
    final fertilizer    = nutrient['fertilizer_recommendation'] as String? ?? '';
    final reason        = nutrient['reason'] as String? ?? '';

    final badgeColor = hasDeficiency ? const Color(0xFFC2410C) : const Color(0xFF15803D);
    final badgeBg    = hasDeficiency ? const Color(0xFFFFF7ED) : const Color(0xFFF0FDF4);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(12), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF0FDF4),
              borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
              border: Border(bottom: BorderSide(color: Color(0xFFBBF7D0))),
            ),
            child: Row(children: [
              const Icon(Icons.eco_rounded, color: Color(0xFF16a34a), size: 18),
              const SizedBox(width: 8),
              const Expanded(child: Text('Nutrient Deficiency Analysis',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
              if (hasDeficiency)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFFED7AA))),
                  child: Text(deficiency,
                      style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Status badge + confidence
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: hasDeficiency ? const Color(0xFFFED7AA) : const Color(0xFFBBF7D0)),
                  ),
                  child: Text(
                    hasDeficiency ? '⚠️ Deficiency Detected' : '✅ No Deficiency',
                    style: TextStyle(color: badgeColor, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
                if (hasDeficiency) ...[
                  const SizedBox(width: 10),
                  Text('${(confidence * 100).toStringAsFixed(0)}% confidence',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ],
              ]),
              if (hasDeficiency) ...[
                if (symptoms.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('Symptoms Observed',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                          color: Color(0xFF94A3B8), letterSpacing: 0.3)),
                  const SizedBox(height: 6),
                  ...symptoms.map((s) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Padding(padding: EdgeInsets.only(top: 5), child: Icon(Icons.circle, size: 5, color: Color(0xFFF59E0B))),
                      const SizedBox(width: 8),
                      Expanded(child: Text(s, style: const TextStyle(fontSize: 12, height: 1.4))),
                    ]),
                  )),
                ],
                if (fertilizer.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(10),
                      border: const Border(left: BorderSide(color: Color(0xFF22C55E), width: 3)),
                    ),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('🧴', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Fertilizer Recommendation',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                                color: Color(0xFF94A3B8), letterSpacing: 0.3)),
                        const SizedBox(height: 4),
                        Text(fertilizer, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.4)),
                      ])),
                    ]),
                  ),
                ],
                if (reason.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _TxNote(reason),
                ],
              ] else if (reason.isNotEmpty) ...[
                const SizedBox(height: 8),
                _TxNote(reason),
              ],
            ]),
          ),
        ],
      ),
    );
  }
}
