import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Cotton disease knowledge-base screen.
/// Implements the "Disease Library" concept from the design spec.
class DiseaseGuideScreen extends StatefulWidget {
  const DiseaseGuideScreen({super.key});
  @override
  State<DiseaseGuideScreen> createState() => _DiseaseGuideScreenState();
}

class _DiseaseGuideScreenState extends State<DiseaseGuideScreen> {
  String _filter = 'All';
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _diseases.where((d) {
      final matchFilter = _filter == 'All' || d.type == _filter;
      final q = _search.toLowerCase();
      final matchSearch = q.isEmpty ||
          d.name.toLowerCase().contains(q) ||
          d.scientificName.toLowerCase().contains(q) ||
          d.symptoms.any((s) => s.toLowerCase().contains(q));
      return matchFilter && matchSearch;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9F4),
      body: CustomScrollView(
        slivers: [
          // ── Gradient app bar ────────────────────────────────────
          SliverAppBar(
            expandedHeight: 110,
            pinned: true,
            backgroundColor: const Color(0xFF14532d),
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding:
                  const EdgeInsets.fromLTRB(16, 0, 16, 14),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Disease Guide',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                    ),
                  ),
                  Text(
                    '${_diseases.length} detectable diseases',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.70),
                      fontSize: 11,
                    ),
                  ),
                ],
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

          // ── Search + filters ────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                children: [
                  // Search bar
                  Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (v) => setState(() => _search = v),
                      decoration: InputDecoration(
                        hintText: 'Search disease or symptom…',
                        hintStyle: const TextStyle(
                            fontSize: 13, color: Color(0xFF9CA3AF)),
                        prefixIcon: const Icon(Icons.search_rounded,
                            color: Color(0xFF16a34a), size: 20),
                        suffixIcon: _search.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded,
                                    size: 18, color: Color(0xFF9CA3AF)),
                                onPressed: () {
                                  _searchCtrl.clear();
                                  setState(() => _search = '');
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Filter chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['All', 'Pest', 'Fungal', 'Bacterial',
                              'Viral']
                          .map(
                            (f) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: GestureDetector(
                                onTap: () => setState(() => _filter = f),
                                child: AnimatedContainer(
                                  duration:
                                      const Duration(milliseconds: 180),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: _filter == f
                                        ? const Color(0xFF16a34a)
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: _filter == f
                                          ? const Color(0xFF16a34a)
                                          : const Color(0xFFE5E7EB),
                                    ),
                                    boxShadow: _filter == f
                                        ? [
                                            BoxShadow(
                                              color: const Color(0xFF16a34a)
                                                  .withOpacity(0.25),
                                              blurRadius: 8,
                                              offset: const Offset(0, 2),
                                            ),
                                          ]
                                        : null,
                                  ),
                                  child: Text(
                                    f,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: _filter == f
                                          ? Colors.white
                                          : const Color(0xFF6B7280),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Count label ─────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
              child: Text(
                '${filtered.length} result${filtered.length == 1 ? '' : 's'}',
                style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                    fontWeight: FontWeight.w500),
              ),
            ),
          ),

          // ── Disease list ────────────────────────────────────────
          filtered.isEmpty
              ? SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_off_rounded,
                            size: 52, color: Color(0xFF9CA3AF)),
                        const SizedBox(height: 12),
                        Text('No diseases match "$_search"',
                            style: const TextStyle(
                                color: Color(0xFF9CA3AF), fontSize: 14)),
                      ],
                    ),
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => _DiseaseCard(disease: filtered[i]),
                      childCount: filtered.length,
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

// ── Disease card ──────────────────────────────────────────────────────────────
class _DiseaseCard extends StatefulWidget {
  final _Disease disease;
  const _DiseaseCard({required this.disease});
  @override
  State<_DiseaseCard> createState() => _DiseaseCardState();
}

class _DiseaseCardState extends State<_DiseaseCard>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;
  late final AnimationController _animCtrl;
  late final Animation<double> _expandAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 250));
    _expandAnim =
        CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    if (_expanded) {
      _animCtrl.forward();
    } else {
      _animCtrl.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.disease;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Header row ─────────────────────────────────────────
          InkWell(
            onTap: _toggle,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: d.typeColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: Center(
                      child: Text(d.emoji,
                          style: const TextStyle(fontSize: 22)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Name + sci
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          d.name,
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: const Color(0xFF111827),
                          ),
                        ),
                        Text(
                          d.scientificName,
                          style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF9CA3AF),
                              fontStyle: FontStyle.italic),
                        ),
                        const SizedBox(height: 5),
                        Row(children: [
                          _TypeBadge(type: d.type, color: d.typeColor),
                          const SizedBox(width: 6),
                          _SeverityDot(
                              label: d.maxSeverity,
                              color: d.severityColor),
                        ]),
                      ],
                    ),
                  ),
                  // Expand icon
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 250),
                    child: const Icon(Icons.keyboard_arrow_down_rounded,
                        color: Color(0xFF9CA3AF)),
                  ),
                ],
              ),
            ),
          ),

          // ── Expandable detail ──────────────────────────────────
          SizeTransition(
            sizeFactor: _expandAnim,
            child: Column(
              children: [
                const Divider(height: 1, color: Color(0xFFF3F4F6)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Description
                      Text(
                        d.description,
                        style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF374151),
                            height: 1.6),
                      ),
                      const SizedBox(height: 12),

                      // Symptoms
                      _DetailSection(
                        icon: Icons.visibility_rounded,
                        title: 'Symptoms',
                        color: const Color(0xFFf59e0b),
                        children: d.symptoms
                            .map(
                              (s) => _BulletRow(
                                  text: s,
                                  color: const Color(0xFFf59e0b)),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 10),

                      // Treatment
                      _DetailSection(
                        icon: Icons.medical_services_rounded,
                        title: 'Quick Treatment',
                        color: const Color(0xFF16a34a),
                        children: d.quickTreatment
                            .map(
                              (t) => _BulletRow(
                                  text: t,
                                  color: const Color(0xFF16a34a)),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 10),

                      // Prevention
                      _DetailSection(
                        icon: Icons.shield_rounded,
                        title: 'Prevention',
                        color: const Color(0xFF6366f1),
                        children: d.prevention
                            .map(
                              (p) => _BulletRow(
                                  text: p,
                                  color: const Color(0xFF6366f1)),
                            )
                            .toList(),
                      ),

                      // AI note
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: const Color(0xFFBBF7D0)),
                        ),
                        child: Row(children: [
                          const Icon(Icons.biotech_rounded,
                              color: Color(0xFF16a34a), size: 14),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'AI model detects this disease with ${d.modelAccuracy}% accuracy.',
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF15803D),
                                  height: 1.4),
                            ),
                          ),
                        ]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String type;
  final Color color;
  const _TypeBadge({required this.type, required this.color});
  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(type,
            style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: color)),
      );
}

class _SeverityDot extends StatelessWidget {
  final String label;
  final Color color;
  const _SeverityDot({required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration:
                BoxDecoration(shape: BoxShape.circle, color: color),
          ),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 9,
                  color: color,
                  fontWeight: FontWeight.w600)),
        ],
      );
}

class _DetailSection extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final List<Widget> children;
  const _DetailSection(
      {required this.icon,
      required this.title,
      required this.color,
      required this.children});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 6),
            Text(title,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: color,
                    letterSpacing: 0.3)),
          ]),
          const SizedBox(height: 6),
          ...children,
        ],
      );
}

class _BulletRow extends StatelessWidget {
  final String text;
  final Color color;
  const _BulletRow({required this.text, required this.color});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Container(
              width: 5,
              height: 5,
              decoration:
                  BoxDecoration(shape: BoxShape.circle, color: color),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
              child: Text(text,
                  style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF374151),
                      height: 1.5))),
        ]),
      );
}

// ── Disease data model ────────────────────────────────────────────────────────
class _Disease {
  final String name, scientificName, emoji, type, description, maxSeverity;
  final List<String> symptoms, quickTreatment, prevention;
  final int modelAccuracy;
  const _Disease({
    required this.name,
    required this.scientificName,
    required this.emoji,
    required this.type,
    required this.description,
    required this.maxSeverity,
    required this.symptoms,
    required this.quickTreatment,
    required this.prevention,
    required this.modelAccuracy,
  });

  Color get typeColor {
    switch (type) {
      case 'Pest': return const Color(0xFFf59e0b);
      case 'Fungal': return const Color(0xFF16a34a);
      case 'Bacterial': return const Color(0xFFef4444);
      case 'Viral': return const Color(0xFF6366f1);
      default: return Colors.grey;
    }
  }

  Color get severityColor {
    switch (maxSeverity.toLowerCase()) {
      case 'low': return const Color(0xFF22c55e);
      case 'moderate': return const Color(0xFFf59e0b);
      case 'high': return const Color(0xFFef4444);
      case 'critical': return const Color(0xFF7c3aed);
      default: return Colors.grey;
    }
  }
}

const List<_Disease> _diseases = [
  _Disease(
    name: 'Aphids',
    scientificName: 'Aphis gossypii',
    emoji: '🐛',
    type: 'Pest',
    maxSeverity: 'High',
    description:
        'Tiny sap-sucking insects that cluster on tender shoots and leaf undersides, causing leaf curl, yellowing, and sticky honeydew deposits.',
    symptoms: [
      'Leaf curling and distortion',
      'Yellowing or wilting of young leaves',
      'Sticky honeydew residue on leaves',
      'Sooty mold development',
      'Stunted plant growth',
    ],
    quickTreatment: [
      'Imidacloprid 17.8% SL @ 0.3 ml/L water',
      'Dimethoate 30% EC @ 1.5 ml/L as foliar spray',
      'Neem oil 5% solution for organic control',
    ],
    prevention: [
      'Avoid excessive nitrogen fertilization',
      'Introduce natural predators (ladybirds)',
      'Regular field scouting every 3–4 days',
      'Remove weeds that host aphid colonies',
    ],
    modelAccuracy: 94,
  ),
  _Disease(
    name: 'Army Worm',
    scientificName: 'Spodoptera litura',
    emoji: '🪲',
    type: 'Pest',
    maxSeverity: 'Critical',
    description:
        'Voracious caterpillars that feed in groups and can defoliate entire fields rapidly. Active mainly at night and during early morning.',
    symptoms: [
      'Large irregular holes in leaf lamina',
      'Skeletonized leaves',
      'Egg masses on leaf undersides',
      'Frass (droppings) on leaves',
      'Defoliation starting from crop borders',
    ],
    quickTreatment: [
      'Spinosad 45 SC @ 0.3 ml/L as evening spray',
      'Chlorpyrifos 20% EC @ 2.5 ml/L',
      'Bacillus thuringiensis (Bt) spray for organic option',
    ],
    prevention: [
      'Deep summer plowing to expose pupae',
      'Light traps at 1 per acre',
      'Pheromone traps for monitoring',
      'Crop rotation with non-host plants',
    ],
    modelAccuracy: 91,
  ),
  _Disease(
    name: 'Bacterial Blight',
    scientificName: 'Xanthomonas citri pv. malvacearum',
    emoji: '🦠',
    type: 'Bacterial',
    maxSeverity: 'Critical',
    description:
        'Serious bacterial disease causing angular leaf spots, black-arm symptoms, and boll rot. Spread by rain splash and contaminated seeds.',
    symptoms: [
      'Angular water-soaked lesions on leaves',
      'Lesions turn brown with yellow halo',
      'Black discoloration of veins (black-arm)',
      'Dark sunken spots on bolls',
      'Stem cankers and wilting',
    ],
    quickTreatment: [
      'Copper oxychloride 50% WP @ 3g/L',
      'Streptomycin sulfate + Tetracycline spray',
      'Remove and destroy infected plant parts',
    ],
    prevention: [
      'Use certified disease-free seeds',
      'Seed treatment with Trichoderma',
      'Avoid overhead irrigation',
      'Maintain field hygiene, remove crop debris',
    ],
    modelAccuracy: 89,
  ),
  _Disease(
    name: 'Powdery Mildew',
    scientificName: 'Leveillula taurica',
    emoji: '🍃',
    type: 'Fungal',
    maxSeverity: 'Moderate',
    description:
        'Fungal disease producing white powdery coating on leaf surfaces. Favored by dry conditions with high humidity and moderate temperatures.',
    symptoms: [
      'White powdery patches on upper leaf surface',
      'Yellowing of affected leaf areas',
      'Premature leaf drop',
      'Reduced photosynthesis',
      'Distortion of young tissues',
    ],
    quickTreatment: [
      'Sulfur 80% WP @ 2g/L water spray',
      'Hexaconazole 5% EC @ 1ml/L',
      'Baking soda (1%) spray as organic option',
    ],
    prevention: [
      'Avoid dense planting — ensure air circulation',
      'Practice basal watering only',
      'Reduce excessive nitrogen application',
      'Use resistant cotton varieties',
    ],
    modelAccuracy: 93,
  ),
  _Disease(
    name: 'Target Spot',
    scientificName: 'Corynespora cassiicola',
    emoji: '🎯',
    type: 'Fungal',
    maxSeverity: 'High',
    description:
        'Fungal disease causing circular lesions with concentric rings resembling a target. Thrives in warm humid conditions.',
    symptoms: [
      'Circular brown lesions with concentric rings',
      'Yellow halo around lesions',
      'Lesions up to 1 cm diameter',
      'Premature defoliation in severe cases',
      'Brown spots on bolls',
    ],
    quickTreatment: [
      'Azoxystrobin 23% SC @ 1ml/L',
      'Mancozeb 75% WP @ 2.5g/L',
      'Propiconazole 25% EC @ 1ml/L',
    ],
    prevention: [
      'Crop rotation with non-host plants',
      'Remove infected plant debris after harvest',
      'Apply targeted foliar sprays preventively',
      'Avoid waterlogged conditions',
    ],
    modelAccuracy: 88,
  ),
  _Disease(
    name: 'Curl Virus',
    scientificName: 'Cotton Leaf Curl Begomovirus',
    emoji: '🌀',
    type: 'Viral',
    maxSeverity: 'Critical',
    description:
        'Devastating viral disease transmitted by whitefly (Bemisia tabaci). Causes severe leaf curling, vein thickening, and significant yield loss.',
    symptoms: [
      'Upward or downward curling of leaves',
      'Thickening and darkening of leaf veins',
      'Enations (leaf-like outgrowths) on veins',
      'Stunted plant growth',
      'Drastic reduction in boll formation',
    ],
    quickTreatment: [
      'No direct cure — manage whitefly vector urgently',
      'Imidacloprid 17.8 SL @ 0.3ml/L to control whitefly',
      'Remove and destroy severely infected plants',
    ],
    prevention: [
      'Plant virus-resistant/tolerant cotton varieties',
      'Use reflective mulches to repel whitefly',
      'Avoid late planting',
      'Monitor and control whitefly populations early',
    ],
    modelAccuracy: 87,
  ),
  _Disease(
    name: 'Healthy',
    scientificName: 'No disease detected',
    emoji: '✅',
    type: 'Healthy',
    maxSeverity: 'Low',
    description:
        'Leaf shows no signs of disease, pest damage, or nutrient deficiency. Continue routine field monitoring and good agronomic practices.',
    symptoms: [
      'Deep green leaf color',
      'No lesions or spots',
      'Normal leaf shape and texture',
    ],
    quickTreatment: [
      'Continue balanced fertilization',
      'Maintain irrigation schedule',
      'Scout regularly every 5–7 days',
    ],
    prevention: [
      'Timely sowing with certified seeds',
      'Follow integrated pest management (IPM)',
      'Maintain field sanitation',
    ],
    modelAccuracy: 97,
  ),
];
