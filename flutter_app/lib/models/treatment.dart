class Treatment {
  final String id;
  final String disease;
  final String title;
  final String description;
  final List<String> steps;

  Treatment({
    required this.id,
    required this.disease,
    required this.title,
    required this.description,
    required this.steps,
  });

  factory Treatment.fromJson(Map<String, dynamic> j) => Treatment(
    id: j['id'] ?? '',
    disease: j['disease'] ?? '',
    title: j['title'] ?? '',
    description: j['description'] ?? '',
    steps: List<String>.from(j['steps'] ?? []),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'disease': disease,
    'title': title,
    'description': description,
    'steps': steps,
  };
}
