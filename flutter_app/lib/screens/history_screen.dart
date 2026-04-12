import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class HistoryScreen extends StatefulWidget {
  final bool embedded;
  const HistoryScreen({super.key, this.embedded = false});
  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  bool _hasMore = true;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      _page = 1;
      _hasMore = true;
    }
    if (!_hasMore) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data =
          await ApiService.instance.getHistory(page: _page, pageSize: 15);
      final items = data['items'] as List? ?? [];
      final total = data['total'] as int? ?? 0;
      if (mounted) {
        setState(() {
          if (reset) {
            _items = items;
          } else {
            _items.addAll(items);
          }
          _total = total;
          _hasMore = _items.length < total;
          _page++;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  Color _severityColor(String? level) {
    switch ((level ?? '').toLowerCase()) {
      case 'low':
        return const Color(0xFF22c55e);
      case 'medium':
        return const Color(0xFFf59e0b);
      case 'high':
        return const Color(0xFFef4444);
      case 'critical':
        return const Color(0xFF7c3aed);
      default:
        return const Color(0xFF6b7280);
    }
  }

  String _formatDate(String? raw) {
    if (raw == null) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      final diff = DateTime.now().difference(dt);
      if (diff.inDays == 0) return 'Today';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays} days ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF9),
      body: RefreshIndicator(
        onRefresh: () => _load(reset: true),
        color: const Color(0xFF16a34a),
        child: CustomScrollView(
          slivers: [
            if (!widget.embedded)
              SliverAppBar(
                expandedHeight: 80,
                pinned: true,
                backgroundColor: const Color(0xFF14532d),
                foregroundColor: Colors.white,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    'Scan History',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 17,
                    ),
                  ),
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF14532d), Color(0xFF16a34a)],
                      ),
                    ),
                  ),
                ),
              )
            else
              SliverAppBar(
                expandedHeight: 100,
                pinned: true,
                automaticallyImplyLeading: false,
                backgroundColor: const Color(0xFF14532d),
                flexibleSpace: FlexibleSpaceBar(
                  titlePadding:
                      const EdgeInsets.fromLTRB(16, 0, 16, 14),
                  title: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Scan History',
                        style: GoogleFonts.poppins(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '$_total records',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withOpacity(0.70),
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

            // content
            SliverToBoxAdapter(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading && _items.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(color: Color(0xFF16a34a)),
        ),
      );
    }

    if (_error != null && _items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.wifi_off_rounded,
                    size: 52, color: Color(0xFFEF4444)),
                const SizedBox(height: 16),
                Text(_error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFFDC2626))),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => _load(reset: true),
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Retry'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16a34a),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ]),
        ),
      );
    }

    if (_items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: const Color(0xFF16a34a).withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.history_toggle_off_rounded,
                      size: 50, color: Color(0xFF16a34a)),
                ),
                const SizedBox(height: 20),
                Text('No scans yet',
                    style: GoogleFonts.poppins(
                        fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                const Text(
                  'Use the Scan button to start analyzing\nyour cotton leaves.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, height: 1.5),
                ),
              ]),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.analytics_outlined,
                size: 16, color: Color(0xFF6B7280)),
            const SizedBox(width: 6),
            Text('$_total scans total',
                style: const TextStyle(
                    color: Color(0xFF6B7280), fontSize: 13)),
          ]),
          const SizedBox(height: 14),
          ...List.generate(_items.length, (i) {
            final item = _items[i] as Map<String, dynamic>;
            final disease =
                item['disease_detected'] as String? ?? 'Unknown';
            final confRaw = item['confidence_percentage'];
            final conf = confRaw is num
                ? confRaw
                : num.tryParse(confRaw?.toString() ?? '') ?? 0;
            final sev = item['severity_level'] as String? ?? '';
            final date =
                _formatDate(item['analyzed_at'] as String?);
            final location = item['location_name'] as String?;
            final sevColor = _severityColor(sev);

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
              child: IntrinsicHeight(
                child: Row(
                  children: [
                    // Severity accent bar
                    Container(
                      width: 5,
                      decoration: BoxDecoration(
                        color: sevColor,
                        borderRadius: const BorderRadius.horizontal(
                            left: Radius.circular(16)),
                      ),
                    ),
                    // Content
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            // Icon
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: sevColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(13),
                              ),
                              child: Icon(Icons.eco_rounded,
                                  color: sevColor, size: 24),
                            ),
                            const SizedBox(width: 12),
                            // Text section
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    disease,
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Row(children: [
                                    Container(
                                      padding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 2),
                                      decoration: BoxDecoration(
                                        color: sevColor,
                                        borderRadius:
                                            BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        sev.isEmpty ? 'N/A' : sev,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${conf.toStringAsFixed(1)}% conf',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF6B7280)),
                                    ),
                                  ]),
                                  if (location != null &&
                                      location.isNotEmpty)
                                    Padding(
                                      padding:
                                          const EdgeInsets.only(top: 4),
                                      child: Row(children: [
                                        const Icon(
                                            Icons.location_on_outlined,
                                            size: 12,
                                            color: Color(0xFF9CA3AF)),
                                        const SizedBox(width: 3),
                                        Flexible(
                                          child: Text(
                                            location,
                                            style: const TextStyle(
                                                fontSize: 11,
                                                color: Color(0xFF9CA3AF)),
                                            maxLines: 1,
                                            overflow:
                                                TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ]),
                                    ),
                                ],
                              ),
                            ),
                            // Date + chevron
                            Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.end,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  date,
                                  style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF9CA3AF)),
                                ),
                                const SizedBox(height: 6),
                                const Icon(Icons.chevron_right,
                                    color: Color(0xFFD1D5DB), size: 20),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          if (_hasMore)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton.icon(
                  onPressed: _loading ? null : _load,
                  icon: _loading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF16a34a)))
                      : const Icon(Icons.expand_more_rounded,
                          color: Color(0xFF16a34a)),
                  label: const Text('Load more',
                      style: TextStyle(color: Color(0xFF16a34a))),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF16a34a)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
