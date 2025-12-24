import 'package:json_annotation/json_annotation.dart';

part 'prediction.g.dart';

@JsonSerializable()
class Prediction {
  final String id;
  final String imagePath;
  final String disease;
  final double confidence;
  final String severity;
  final DateTime timestamp;
  final String? xaiData;
  final bool synced;
  final Map<String, dynamic>? explanation;

  Prediction({
    required this.id,
    required this.imagePath,
    required this.disease,
    required this.confidence,
    required this.severity,
    required this.timestamp,
    this.xaiData,
    this.synced = false,
    this.explanation,
  });

  factory Prediction.fromJson(Map<String, dynamic> json) =>
      _$PredictionFromJson(json);
  Map<String, dynamic> toJson() => _$PredictionToJson(this);

  /// Create a copy of Prediction with modified fields
  Prediction copyWith({
    String? id,
    String? imagePath,
    String? disease,
    double? confidence,
    String? severity,
    DateTime? timestamp,
    String? xaiData,
    bool? synced,
    Map<String, dynamic>? explanation,
  }) {
    return Prediction(
      id: id ?? this.id,
      imagePath: imagePath ?? this.imagePath,
      disease: disease ?? this.disease,
      confidence: confidence ?? this.confidence,
      severity: severity ?? this.severity,
      timestamp: timestamp ?? this.timestamp,
      xaiData: xaiData ?? this.xaiData,
      synced: synced ?? this.synced,
      explanation: explanation ?? this.explanation,
    );
  }
}
