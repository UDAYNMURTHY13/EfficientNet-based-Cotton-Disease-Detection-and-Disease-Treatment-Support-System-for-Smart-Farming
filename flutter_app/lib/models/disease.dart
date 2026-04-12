class Disease {
  final String name;
  final String description;
  final String cause;
  final List<String> symptoms;
  final List<String> treatments;

  Disease({
    required this.name,
    required this.description,
    required this.cause,
    required this.symptoms,
    required this.treatments,
  });

  factory Disease.fromJson(Map<String, dynamic> j) => Disease(
    name: j['name'] ?? '',
    description: j['description'] ?? '',
    cause: j['cause'] ?? '',
    symptoms: List<String>.from(j['symptoms'] ?? []),
    treatments: List<String>.from(j['treatments'] ?? []),
  );

  Map<String, dynamic> toJson() => {
    'name': name,
    'description': description,
    'cause': cause,
    'symptoms': symptoms,
    'treatments': treatments,
  };
}
