class Prediction {
  final String id;
  final String imagePath;
  final String disease;
  final double confidence;
  final String severity;
  final DateTime timestamp;

  Prediction({
    required this.id,
    required this.imagePath,
    required this.disease,
    required this.confidence,
    required this.severity,
    required this.timestamp,
  });

  factory Prediction.fromJson(Map<String, dynamic> j) => Prediction(
    id: j['id'] ?? '',
    imagePath: j['image_path'] ?? '',
    disease: j['disease'] ?? '',
    confidence: (j['confidence'] as num? ?? 0).toDouble(),
    severity: j['severity'] ?? '',
    timestamp: DateTime.tryParse(j['timestamp'] ?? '') ?? DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'image_path': imagePath,
    'disease': disease,
    'confidence': confidence,
    'severity': severity,
    'timestamp': timestamp.toIso8601String(),
  };
}
