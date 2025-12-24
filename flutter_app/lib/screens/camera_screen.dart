import 'package:flutter/material.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({Key? key}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Cotton Leaf'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                height: 300,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[400]!),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.image_not_supported, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No image selected'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _isProcessing ? null : _captureImage,
                icon: const Icon(Icons.camera_alt),
                label: const Text('Capture Image'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _isProcessing ? null : _selectFromGallery,
                icon: const Icon(Icons.image),
                label: const Text('Choose from Gallery'),
              ),
              const SizedBox(height: 32),
              if (_isProcessing)
                const Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Analyzing image...', textAlign: TextAlign.center),
                  ],
                )
              else
                ElevatedButton(
                  onPressed: () {
                    setState(() => _isProcessing = true);
                    Future.delayed(const Duration(seconds: 3), () {
                      if (mounted) {
                        Navigator.pushNamed(context, '/results');
                      }
                    });
                  },
                  child: const Text('Analyze'),
                ),
              const SizedBox(height: 16),
              const Text(
                'Tips for best results:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                '• Ensure good lighting\n'
                '• Focus on the affected area\n'
                '• Use a plain background\n'
                '• Keep the leaf flat',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _captureImage() {
    // TODO: Implement camera integration
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Camera integration coming soon')),
    );
  }

  void _selectFromGallery() {
    // TODO: Implement gallery picker
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Gallery picker coming soon')),
    );
  }
}
