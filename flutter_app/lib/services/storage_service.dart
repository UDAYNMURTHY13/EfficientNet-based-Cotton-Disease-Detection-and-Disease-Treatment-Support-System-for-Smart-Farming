import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/prediction.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  static Database? _database;

  factory StorageService() {
    return _instance;
  }

  StorageService._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final databasePath = await getDatabasesPath();
    final path = join(databasePath, 'cotton_care.db');

    return openDatabase(
      path,
      version: 1,
      onCreate: _createTables,
    );
  }

  Future<void> _createTables(Database db, int version) async {
    // Predictions table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        image_path TEXT NOT NULL,
        disease TEXT NOT NULL,
        confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        xai_data TEXT
      )
    ''');

    // Scan history table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS scan_history (
        id TEXT PRIMARY KEY,
        prediction_id TEXT NOT NULL,
        user_notes TEXT,
        treatment_applied TEXT,
        created_at TEXT,
        FOREIGN KEY(prediction_id) REFERENCES predictions(id)
      )
    ''');

    // Treatments table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS treatments (
        id TEXT PRIMARY KEY,
        disease TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        steps TEXT,
        pesticides TEXT,
        precautions TEXT,
        days_to_apply INTEGER,
        efficacy TEXT,
        created_at TEXT
      )
    ''');
  }

  /// Save a prediction to local database
  Future<void> savePrediction(Prediction prediction) async {
    final db = await database;
    await db.insert(
      'predictions',
      {
        'id': prediction.id,
        'image_path': prediction.imagePath,
        'disease': prediction.disease,
        'confidence': prediction.confidence,
        'severity': prediction.severity,
        'timestamp': prediction.timestamp.toIso8601String(),
        'synced': 0,
        'xai_data': null,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Get all predictions
  Future<List<Prediction>> getAllPredictions() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('predictions');

    return List.generate(maps.length, (i) {
      return Prediction(
        id: maps[i]['id'],
        imagePath: maps[i]['image_path'],
        disease: maps[i]['disease'],
        confidence: maps[i]['confidence'],
        severity: maps[i]['severity'],
        timestamp: DateTime.parse(maps[i]['timestamp']),
      );
    });
  }

  /// Get unsync predictions
  Future<List<Prediction>> getUnsyncedPredictions() async {
    final db = await database;
    final List<Map<String, dynamic>> maps =
        await db.query('predictions', where: 'synced = 0');

    return List.generate(maps.length, (i) {
      return Prediction(
        id: maps[i]['id'],
        imagePath: maps[i]['image_path'],
        disease: maps[i]['disease'],
        confidence: maps[i]['confidence'],
        severity: maps[i]['severity'],
        timestamp: DateTime.parse(maps[i]['timestamp']),
      );
    });
  }

  /// Mark prediction as synced
  Future<void> markAsSynced(String predictionId) async {
    final db = await database;
    await db.update(
      'predictions',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [predictionId],
    );
  }

  /// Delete a prediction
  Future<void> deletePrediction(String predictionId) async {
    final db = await database;
    await db.delete(
      'predictions',
      where: 'id = ?',
      whereArgs: [predictionId],
    );
  }

  /// Clear all local data
  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('predictions');
    await db.delete('scan_history');
    await db.delete('treatments');
  }

  /// Close database
  Future<void> close() async {
    final db = await database;
    db.close();
  }
}
