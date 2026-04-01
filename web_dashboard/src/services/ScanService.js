import { apiService } from './api';

/**
 * Enhanced Scan Service
 * Handles the complete workflow for cotton leaf disease detection
 * Includes: upload, prediction, report generation, verification submission
 */

class ScanService {
  static dataUrlToBlob(dataUrl) {
    if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
      throw new Error('Invalid image data format');
    }

    const [meta, base64] = dataUrl.split(',');
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i += 1) {
      array[i] = bytes.charCodeAt(i);
    }

    return new Blob([array], { type: mime });
  }

  static normalizeSeverity(severity) {
    if (typeof severity === 'string') {
      return severity.toUpperCase();
    }

    const level = severity?.level;
    if (!level) {
      return 'LOW';
    }

    const normalized = String(level).toUpperCase();
    const mapping = {
      NONE: 'NONE',
      MILD: 'LOW',
      MODERATE: 'MEDIUM',
      SEVERE: 'HIGH',
      CRITICAL: 'HIGH',
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
    };

    return mapping[normalized] || 'LOW';
  }

  /**
   * Generate unique scan ID with timestamp
   */
  static generateScanId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `SCAN-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get current geolocation
   */
  static async getGeolocation() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            });
          },
          (error) => {
            console.warn('Geolocation error:', error);
            resolve({
              latitude: null,
              longitude: null,
              accuracy: null,
              timestamp: new Date().toISOString(),
              error: error.message,
            });
          }
        );
      } else {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: new Date().toISOString(),
          error: 'Geolocation not supported',
        });
      }
    });
  }

  /**
   * Create a new scan object
   */
  static async createScan(imageData, farmerInfo) {
    const scanId = this.generateScanId();
    const timestamp = new Date().toISOString();
    const location = await this.getGeolocation();

    return {
      scanId,
      farmerId: farmerInfo.id,
      farmerName: farmerInfo.name,
      farmerEmail: farmerInfo.email,
      imageData: imageData, // Base64 encoded image
      timestamp,
      location,
      status: 'PENDING_PREDICTION', // PENDING_PREDICTION -> PREDICTED -> PENDING_VERIFICATION -> VERIFIED/REJECTED
      prediction: null,
      report: null,
      verification: null,
      metadata: {
        uploadedAt: timestamp,
        processedAt: null,
        verifiedAt: null,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      },
    };
  }

  /**
   * Call ML model to predict disease
   * Uses running backend API /predict endpoint
   */
  static async predictDisease(scan) {
    try {
      console.log('🤖 Calling real ML model for disease prediction...');
      console.log(`📸 Scan ID: ${scan.scanId}`);
      
      const ML_SERVICE_URL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000';
      console.log(`🔌 ML Service URL: ${ML_SERVICE_URL}`);

      const imageBlob = this.dataUrlToBlob(scan.imageData);
      const formData = new FormData();
      formData.append('file', imageBlob, `${scan.scanId}.jpg`);
      
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ML prediction failed`);
      }

      const prediction = await response.json();
      const normalizedSeverity = this.normalizeSeverity(prediction.severity);
      const severityDescription = prediction.severity?.description || 'Prediction completed successfully';
      
      console.log(`[OK] Prediction received: ${prediction.disease} (${prediction.confidence_percentage})`);
      console.log(`[SEVERITY] ${normalizedSeverity}`);
      console.log(`[TIME] ${prediction.inference_time}s`);

      const updatedScan = {
        ...scan,
        status: 'PREDICTED',
        prediction: {
          primaryDisease: {
            name: prediction.disease,
            confidence: prediction.confidence,
            severity: normalizedSeverity,
            description: severityDescription,
          },
          allPredictions: prediction.all_predictions || prediction.allPredictions || {},
          modelVersion: prediction.model_version || prediction.modelVersion || '2.0',
          modelName: prediction.model_name || prediction.modelName || 'CottonCare API',
          processingTime: prediction.inference_time || prediction.processingTime,
          timestamp: prediction.timestamp,
        },
        metadata: {
          ...scan.metadata,
          processedAt: new Date().toISOString(),
        },
      };

      // Save to database
      await this.saveScanToDatabase(updatedScan);

      return updatedScan;
    } catch (error) {
      console.error('❌ ML Service Error:', error);
      const targetUrl = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000';
      const message = `Cannot connect to ML Service at ${targetUrl}\n\n` +
                      `ERROR: ${error.message}\n\n` +
                      `SOLUTION:\n` +
                      `1. Start backend with: .\\venv\\Scripts\\python run_server.py\n` +
                      `2. Wait 10-15 seconds for services to start\n` +
                      `3. Check backend health at ${targetUrl}/health\n` +
                      `4. Ensure backend port is available`;
      
      alert(message);
      throw new Error(`ML Service Connection Failed: ${error.message}`);
    }
  }

  /**
   * Save scan to backend database
   * Persists prediction results so data survives page refresh
   */
  static async saveScanToDatabase(scan) {
    try {
      console.log('[DB] Saving scan to backend database:', scan.scanId);
      
      const response = await apiService.axiosInstance.post('/api/scans/save', scan);
      
      if (response.data.success) {
        console.log('[OK] Scan saved to database:', response.data.scanId);
        return true;
      } else {
        console.warn('[WARN] Scan save returned false:', response.data);
        return false;
      }
    } catch (error) {
      console.warn('[WARN] Could not save scan to database:', error.message);
      // Don't fail - just warn, user can still see results locally
      return false;
    }
  }

  /**
   * [DEPRECATED] Mock disease prediction 
   * No longer used - now using real ML model
   * Kept for reference/fallback only
   */
  static async mockPredictDisease(imageData) {
    console.warn('⚠️ Using mock prediction - ML service may be offline');
    // Simulate ML model processing time
    return new Promise((resolve) => {
      setTimeout(() => {
        const diseases = [
          {
            name: 'Leaf Blight',
            confidence: 0.87,
            severity: 'HIGH',
            description: 'Cotton leaf blight disease detected with high confidence',
          },
          {
            name: 'Rust',
            confidence: 0.09,
            severity: 'LOW',
            description: 'Minor rust spots detected',
          },
          {
            name: 'Healthy',
            confidence: 0.04,
            severity: 'NONE',
            description: 'Mostly healthy leaf with minor issues',
          },
        ];

        // Get random disease for demo
        const mainDisease = diseases[Math.floor(Math.random() * diseases.length)];

        resolve({
          primaryDisease: mainDisease,
          allPredictions: diseases,
          modelVersion: '1.2.0',
          modelName: 'CottonCare-AI-v1',
          confidence: mainDisease.confidence,
          processingTime: '2.3s',
        });
      }, 2000); // Simulate 2 second processing time
    });
  }

  /**
   * Generate detailed report with treatment recommendations
   */
  static async generateReport(scan) {
    if (!scan.prediction) {
      throw new Error('No prediction available for report generation');
    }

    const disease = scan.prediction.primaryDisease;
    const treatments = this.getTreatmentRecommendations(disease.name);

    return {
      reportId: `RPT-${scan.scanId}`,
      scanId: scan.scanId,
      timestamp: new Date().toISOString(),
      farmerInfo: {
        farmerId: scan.farmerId,
        farmerName: scan.farmerName,
        farmerEmail: scan.farmerEmail,
      },
      diseaseDetection: {
        primaryDisease: disease.name,
        severity: disease.severity,
        confidence: (disease.confidence * 100).toFixed(2) + '%',
        description: disease.description,
        allPredictions: scan.prediction.allPredictions,
      },
      location: scan.location,
      timing: {
        scanTimestamp: scan.timestamp,
        reportGeneratedAt: new Date().toISOString(),
        processingDuration: scan.metadata.processedAt
          ? new Date(scan.metadata.processedAt) - new Date(scan.timestamp)
          : null,
      },
      treatmentRecommendations: treatments,
      immediateActions: this.getImmediateActions(disease.severity),
      preventiveMeasures: this.getPreventiveMeasures(disease.name),
      imagePath: null, // Will be set when image is uploaded
      status: 'PENDING_VERIFICATION',
    };
  }

  /**
   * Get treatment recommendations based on disease
   */
  static getTreatmentRecommendations(diseaseName) {
    const treatments = {
      'Leaf Blight': [
        {
          type: 'Chemical',
          product: 'Copper Fungicide',
          concentration: '0.5-1%',
          applicationRate: '500-750 L/ha',
          interval: '7-10 days',
          effectiveness: '85-90%',
        },
        {
          type: 'Biological',
          product: 'Bacillus subtilis',
          concentration: '1%',
          applicationRate: '1000 L/ha',
          interval: '14 days',
          effectiveness: '60-70%',
        },
      ],
      'Rust': [
        {
          type: 'Chemical',
          product: 'Sulfur Dust',
          concentration: '80%',
          applicationRate: '30 kg/ha',
          interval: '10-14 days',
          effectiveness: '75-85%',
        },
      ],
      'Healthy': [
        {
          type: 'Preventive',
          product: 'Regular Monitoring',
          frequency: 'Weekly',
          actions: 'Scout for symptoms, maintain field hygiene',
          effectiveness: '100%',
        },
      ],
    };

    return treatments[diseaseName] || treatments['Healthy'];
  }

  /**
   * Get immediate action items based on severity
   */
  static getImmediateActions(severity) {
    const actions = {
      HIGH: [
        '⚠️ URGENT: Contact agricultural expert immediately',
        '🚫 Isolate affected area to prevent spread',
        '💧 Reduce irrigation to affected zone',
        '✂️ Remove and burn severely affected leaves',
        '📋 Prepare farm for treatment application',
        '📞 Schedule expert consultation for tomorrow',
      ],
      MEDIUM: [
        '📌 Monitor disease progression closely',
        '✅ Apply recommended fungicide treatment',
        '💧 Maintain appropriate irrigation schedule',
        '🔍 Scout field every 3-4 days',
        '📋 Keep treatment records',
      ],
      LOW: [
        '👀 Continue regular field monitoring',
        '✅ Apply preventive measures',
        '📊 Track for any changes',
        '📋 Maintain field hygiene',
      ],
      NONE: [
        '✓ Leaf is healthy',
        '✅ Continue regular maintenance',
        '🔍 Monitor periodically (weekly)',
      ],
    };

    return actions[severity] || actions['LOW'];
  }

  /**
   * Get preventive measures for specific disease
   */
  static getPreventiveMeasures(diseaseName) {
    return {
      'Leaf Blight': [
        'Crop rotation (3-4 years)',
        'Use resistant varieties',
        'Proper field drainage',
        'Remove infected plant debris',
        'Avoid overhead irrigation',
        'Maintain optimum plant spacing',
      ],
      'Rust': [
        'Plant rust-resistant varieties',
        'Regular field scouting',
        'Avoid water stress',
        'Maintain leaf wetness <12 hours',
        'Improve air circulation',
      ],
      'Healthy': [
        'Maintain good field practices',
        'Regular monitoring',
        'Proper fertilization',
        'Optimum irrigation',
      ],
    }[diseaseName] || [];
  }

  /**
   * Submit scan for expert verification
   */
  static async submitForVerification(scan, report) {
    try {
      const verificationRequest = {
        scanId: scan.scanId,
        reportId: report.reportId,
        farmerId: scan.farmerId,
        farmerName: scan.farmerName,
        farmerEmail: scan.farmerEmail,
        timestamp: new Date().toISOString(),
        imagePath: null, // Set when actually uploaded
        aiPrediction: scan.prediction,
        report: report,
        status: 'PENDING_EXPERT_REVIEW',
        location: scan.location,
        priority: report.diseaseDetection.severity === 'HIGH' ? 'HIGH' : 'NORMAL',
      };

      // In production: await apiService.submitForVerification(scan.scanId, verificationRequest);
      console.log('Verification request submitted:', verificationRequest);

      return verificationRequest;
    } catch (error) {
      console.error('Failed to submit for verification:', error);
      throw error;
    }
  }

  /**
   * Complete scan processing workflow
   */
  static async processScan(imageData, farmerInfo) {
    try {
      // Step 1: Create scan object
      console.log('Step 1: Creating scan object...');
      let scan = await this.createScan(imageData, farmerInfo);

      // Step 2: Call ML model for prediction
      console.log('Step 2: Predicting disease...');
      scan = await this.predictDisease(scan);

      // Step 3: Generate detailed report
      console.log('Step 3: Generating report...');
      const report = await this.generateReport(scan);

      // Step 4: Submit for expert verification
      console.log('Step 4: Submitting for verification...');
      const verification = await this.submitForVerification(scan, report);

      // Return complete package
      return {
        scan,
        report,
        verification,
        status: 'SUCCESS',
        message: 'Scan processed successfully and submitted for expert verification',
      };
    } catch (error) {
      console.error('Scan processing failed:', error);
      throw error;
    }
  }

  /**
   * Format scan data for display
   */
  static formatScanForDisplay(scanResult) {
    return {
      scanId: scanResult.scan.scanId,
      id: scanResult.scan.scanId,
      disease: scanResult.report.diseaseDetection.primaryDisease,
      confidence: scanResult.report.diseaseDetection.confidence,
      severity: scanResult.report.diseaseDetection.severity,
      createdAt: scanResult.scan.timestamp,
      timestamp: scanResult.scan.timestamp,
      location: scanResult.scan.location,
      status: 'Pending Expert Review',
      treatmentCount: scanResult.report.treatmentRecommendations.length,
      immediateActionCount: scanResult.report.immediateActions.length,
    };
  }
}

export default ScanService;
