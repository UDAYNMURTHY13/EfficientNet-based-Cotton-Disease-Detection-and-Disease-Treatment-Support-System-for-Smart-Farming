import 'package:json_annotation/json_annotation.dart';

part 'disease.g.dart';

@JsonSerializable()
class Disease {
  final String id;
  final String name;
  final String description;
  final String severity;
  final double confidence;
  final String symptoms;
  final String prevention;
  final String treatment;
  final DateTime detectedAt;

  Disease({
    required this.id,
    required this.name,
    required this.description,
    required this.severity,
    required this.confidence,
    required this.symptoms,
    required this.prevention,
    required this.treatment,
    required this.detectedAt,
  });

  factory Disease.fromJson(Map<String, dynamic> json) =>
      _$DiseaseFromJson(json);
  Map<String, dynamic> toJson() => _$DiseaseToJson(this);

  String get severityEmoji {
    switch (severity.toLowerCase()) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  Color get severityColor {
    switch (severity.toLowerCase()) {
      case 'high':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}

import 'package:flutter/material.dart';
