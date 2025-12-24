import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart';

class CameraService {
  final ImagePicker _imagePicker = ImagePicker();

  /// Capture image using device camera
  Future<String?> captureImage() async {
    try {
      final XFile? photo = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      return photo?.path;
    } catch (e) {
      debugPrint('Camera capture error: $e');
      return null;
    }
  }

  /// Pick image from gallery
  Future<String?> pickImageFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      return image?.path;
    } catch (e) {
      debugPrint('Gallery pick error: $e');
      return null;
    }
  }

  /// Pick multiple images from gallery
  Future<List<String>> pickMultipleImages() async {
    try {
      final List<XFile> images = await _imagePicker.pickMultiImage(
        imageQuality: 85,
      );
      return images.map((img) => img.path).toList();
    } catch (e) {
      debugPrint('Multiple images pick error: $e');
      return [];
    }
  }
}
