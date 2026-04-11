/**
 * Analysis Results Component
 * Displays disease analysis results with visualizations
 */

import React from 'react';
import '../styles/results.css';

function AnalysisResults({ result }) {
  if (!result || !result.analysis) {
    return <div>No analysis data available</div>;
  }

  const analysis = result.analysis;
  const stage1 = analysis.stage_1_disease_detection;
  const stage2 = analysis.stage_2_area_analysis;
  const stage3 = analysis.stage_3_lesion_analysis;
  const stage4 = analysis.stage_4_severity_estimation;

  const getSeverityClass = (level) => {
    const classes = {
      'Healthy': 'severity-healthy',
      'Mild': 'severity-mild',
      'Moderate': 'severity-moderate',
      'Severe': 'severity-severe',
      'Critical': 'severity-critical'
    };
    return classes[level] || 'severity-moderate';
  };

  const getSeverityColor = (level) => {
    const colors = {
      'Healthy': '#27ae60',
      'Mild': '#f39c12',
      'Moderate': '#e74c3c',
      'Severe': '#c0392b',
      'Critical': '#8b0000'
    };
    return colors[level] || '#e74c3c';
  };

  return (
    <div className="results-container">
      {/* Key Findings */}
      <div className="findings-section">
        <h2>🎯 Analysis Results</h2>
        
        <div className="findings-grid">
          <div className="finding-card">
            <div className="finding-label">Disease Detected</div>
            <div className="finding-value disease-name">{stage1.disease}</div>
          </div>

          <div className="finding-card">
            <div className="finding-label">Confidence Level</div>
            <div className="finding-value confidence">
              {(stage1.confidence * 100).toFixed(1)}%
            </div>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${stage1.confidence * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="finding-card">
            <div className="finding-label">Severity</div>
            <div className={`finding-value severity-badge ${getSeverityClass(stage4.level)}`}>
              {stage4.level}
            </div>
          </div>

          <div className="finding-card">
            <div className="finding-label">Affected Area</div>
            <div className="finding-value affected-area">
              {stage2.affected_area_percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="analysis-details">
        <div className="details-grid">
          <div className="detail-card">
            <h3>📋 Disease Information</h3>
            <div className="detail-item">
              <span className="detail-label">Disease Name:</span>
              <span className="detail-value">{stage1.disease}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Confidence:</span>
              <span className="detail-value">{(stage1.confidence * 100).toFixed(2)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Top Prediction:</span>
              <span className="detail-value">{stage1.confidence_percentage}</span>
            </div>
          </div>

          <div className="detail-card">
            <h3>🔍 Extent Analysis</h3>
            <div className="detail-item">
              <span className="detail-label">Affected Area:</span>
              <span className="detail-value">{stage2.affected_area_percentage}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Lesions Found:</span>
              <span className="detail-value">{stage3.count}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Analysis Time:</span>
              <span className="detail-value">{result.inference_time.toFixed(2)}s</span>
            </div>
          </div>

          <div className="detail-card">
            <h3>⚠️ Severity Assessment</h3>
            <div className="detail-item">
              <span className="detail-label">Level:</span>
              <span className={`detail-value severity-badge ${getSeverityClass(stage4.level)}`}>
                {stage4.level}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Score:</span>
              <span className="detail-value">{stage4.score.toFixed(2)}/4.0</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{stage4.description}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lesion Details */}
      {stage3.details && stage3.details.length > 0 && (
        <div className="lesion-section">
          <h3>🦗 Detected Lesions ({stage3.count})</h3>
          <div className="lesion-grid">
            {stage3.details.map((lesion, idx) => (
              <div key={idx} className="lesion-item">
                <div className="lesion-number">Lesion {idx + 1}</div>
                <div className="lesion-detail">
                  <span className="lesion-label">Area:</span>
                  <span className="lesion-value">{lesion.area_percentage}%</span>
                </div>
                <div className="lesion-detail">
                  <span className="lesion-label">Position:</span>
                  <span className="lesion-value">({lesion.position[0]}, {lesion.position[1]})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="reasoning-section">
        <h3>💡 Analysis Explanation</h3>
        <div className="reasoning-box">
          <p>{stage4.reasoning}</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="recommendation-section">
        <h3>📋 Recommendation</h3>
        <div className={`recommendation-box rec-${stage4.level.toLowerCase()}`}>
          <div className="rec-icon">
            {stage4.level === 'Healthy' && '✓'}
            {stage4.level === 'Mild' && '⚠️'}
            {stage4.level === 'Moderate' && '⚠️'}
            {stage4.level === 'Severe' && '🔴'}
            {stage4.level === 'Critical' && '🔴'}
          </div>
          <div className="rec-content">
            <div className="rec-title">{stage4.description}</div>
            <div className="rec-text">
              {stage4.level === 'Mild' && 'Monitor the plant regularly. Apply preventive measures to prevent disease spread.'}
              {stage4.level === 'Moderate' && 'Apply recommended fungicides or insecticides immediately. Increase monitoring frequency.'}
              {stage4.level === 'Severe' && 'Urgent treatment required. Implement integrated pest management (IPM) strategies. Consult agricultural experts if needed.'}
              {stage4.level === 'Critical' && 'Critical condition! Immediate intervention required. Isolate affected plants. Contact agricultural authorities.'}
              {stage4.level === 'Healthy' && 'Your crops are healthy! Continue regular monitoring and preventive care.'}
            </div>
          </div>
        </div>
      </div>

      {/* XAI Section */}
      <div className="xai-section">
        <h2>🤖 Explainable AI Analysis</h2>
        <div className="xai-cards">
          <div className="xai-card">
            <h4>📊 Detection Factors</h4>
            <div className="xai-content">
              {stage4.indicators && (
                <>
                  <div className="factor-item">
                    <span className="factor-name">Confidence Score</span>
                    <span className="factor-value">{stage4.indicators.confidence}/4</span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-name">Area Score</span>
                    <span className="factor-value">{stage4.indicators.area}/4</span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-name">Lesion Score</span>
                    <span className="factor-value">{stage4.indicators.lesions}/4</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="xai-card">
            <h4>🎯 Severity Breakdown</h4>
            <div className="xai-content">
              {stage4.details && (
                <>
                  <div className="factor-item">
                    <span className="factor-name">Confidence Factor</span>
                    <span className="factor-value">{stage4.details.confidence_score.toFixed(2)}</span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-name">Area Factor</span>
                    <span className="factor-value">{stage4.details.area_score.toFixed(2)}</span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-name">Lesion Factor</span>
                    <span className="factor-value">{stage4.details.lesion_score.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="xai-card">
            <h4>📈 Model Confidence</h4>
            <div className="xai-content">
              <div className="confidence-visual">
                <div className="conf-bar">
                  <div 
                    className="conf-fill" 
                    style={{ 
                      width: `${stage1.confidence * 100}%`,
                      backgroundColor: getSeverityColor(stage4.level)
                    }}
                  ></div>
                </div>
                <div className="conf-text">
                  {stage1.disease} - {(stage1.confidence * 100).toFixed(1)}% confident
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="metadata">
        <div className="metadata-item">
          <span>Diagnosis ID:</span>
          <code>{result.diagnosis_id}</code>
        </div>
        <div className="metadata-item">
          <span>Analyzed at:</span>
          <span>{new Date(result.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResults;
