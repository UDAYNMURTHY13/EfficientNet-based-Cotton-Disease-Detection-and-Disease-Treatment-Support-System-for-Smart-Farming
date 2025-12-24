import 'package:json_annotation/json_annotation.dart';

part 'treatment.g.dart';

@JsonSerializable()
class Treatment {
  final String id;
  final String disease;
  final String title;
  final String description;
  final List<String> steps;
  final List<String> pesticides;
  final String precautions;
  final int daysToApply;
  final String efficacy;
  final DateTime createdAt;

  Treatment({
    required this.id,
    required this.disease,
    required this.title,
    required this.description,
    required this.steps,
    required this.pesticides,
    required this.precautions,
    required this.daysToApply,
    required this.efficacy,
    required this.createdAt,
  });

  factory Treatment.fromJson(Map<String, dynamic> json) =>
      _$TreatmentFromJson(json);
  Map<String, dynamic> toJson() => _$TreatmentToJson(this);
}
