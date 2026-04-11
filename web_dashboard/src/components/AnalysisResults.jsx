import React from "react";
import "../styles/results.css";

const SEV_COLOR = {
  Healthy: "#22c55e", Mild: "#84cc16", Moderate: "#f59e0b",
  Severe: "#ef4444", Critical: "#7f1d1d"
};

const REC_TEXT = {
  Healthy: "Your crops are healthy! Continue regular monitoring and preventive care.",
  Mild: "Monitor regularly. Apply preventive measures to stop disease spread.",
  Moderate: "Apply recommended fungicides or insecticides immediately. Increase monitoring.",
  Severe: "Urgent treatment required. Implement IPM strategies. Consult agricultural experts.",
  Critical: "CRITICAL: Immediate intervention needed. Isolate affected plants. Contact authorities."
};

function ConfBar({ value, color }) {
  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="conf-bar-label">{value.toFixed(1)}%</span>
    </div>
  );
}

function AnalysisResults({ result, originalPreview }) {
  if (!result?.analysis) return <div>No analysis data available</div>;

  const { analysis } = result;
  // Actual pipeline flat structure
  const disease = analysis.disease;
  const confidence = analysis.confidence ?? 0;          // 0-1 float
  const confPct = analysis.confidence_percentage ?? (confidence * 100);
  const affectedArea = analysis.affected_area;          // null for Healthy
  const severity = analysis.severity || {};
  const lesions = analysis.lesion_analysis;             // null for Healthy
  const allPredictions = analysis.all_predictions || {};
  const isHealthy = disease === 'Healthy';

  // severity.level is 'None' when healthy — map to 'Healthy' for display
  const sev = isHealthy ? 'Healthy' : (severity?.level || 'Moderate');
  const color = SEV_COLOR[sev] || '#f59e0b';

  // Sort all_predictions by confidence descending for display
  const predEntries = Object.entries(allPredictions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const grad_cam_overlay = analysis.grad_cam_overlay;
  const grad_cam_heatmap = analysis.grad_cam_heatmap;

  return (
    <div className="results-page">
      {/* Hero strip */}
      <div className="results-hero" style={{ borderLeft: `5px solid ${color}` }}>
        <div className="rh-main">
          <div className="rh-disease">{disease || "Unknown"}</div>
          <div className="rh-desc">{isHealthy ? 'No disease detected — leaf appears healthy' : severity?.description}</div>
        </div>
        <div className="rh-severity" style={{ background: color + "18", color }}>
          <div className="rh-sev-label">Severity</div>
          <div className="rh-sev-value">{sev}</div>
        </div>
      </div>

      {/* Grad-CAM visualization panel — only for disease detections */}
      {!isHealthy && (originalPreview || grad_cam_overlay || grad_cam_heatmap) && (
        <div className="card gradcam-card">
          <div className="card-header">
            <h3>🔥 Grad-CAM Visualization</h3>
            <span className="gradcam-badge">Explainable AI</span>
          </div>
          <div className="card-body">
            <div className="gradcam-grid">
              {originalPreview && (
                <div className="gradcam-panel">
                  <div className="gradcam-label">Original Image</div>
                  <img src={originalPreview} alt="Original leaf" className="gradcam-img" />
                </div>
              )}
              {grad_cam_overlay ? (
                <div className="gradcam-panel">
                  <div className="gradcam-label">Grad-CAM Overlay</div>
                  <img src={grad_cam_overlay} alt="Grad-CAM overlay" className="gradcam-img" />
                </div>
              ) : grad_cam_heatmap ? (
                <div className="gradcam-panel">
                  <div className="gradcam-label">Grad-CAM Heatmap</div>
                  <img src={grad_cam_heatmap} alt="Grad-CAM heatmap" className="gradcam-img" />
                </div>
              ) : null}
              {grad_cam_overlay && grad_cam_heatmap && (
                <div className="gradcam-panel">
                  <div className="gradcam-label">Pure Heatmap</div>
                  <img src={grad_cam_heatmap} alt="Pure heatmap" className="gradcam-img" />
                </div>
              )}
            </div>
            <div className="gradcam-legend">
              <div className="gradcam-legend-item"><span className="gradcam-dot" style={{background:'#0000ff'}} />Low attention</div>
              <div className="gradcam-legend-item"><span className="gradcam-dot" style={{background:'#00ffff'}} />Mild</div>
              <div className="gradcam-legend-item"><span className="gradcam-dot" style={{background:'#00ff00'}} />Moderate</div>
              <div className="gradcam-legend-item"><span className="gradcam-dot" style={{background:'#ffff00'}} />High</div>
              <div className="gradcam-legend-item"><span className="gradcam-dot" style={{background:'#ff0000'}} />Critical focus</div>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="results-metrics">
        {[
          { label: "Confidence", value: `${confPct.toFixed(1)}%`, icon: "🎯" },
          { label: "Affected Area", value: affectedArea != null ? `${Number(affectedArea).toFixed(1)}%` : "—", icon: "🍃" },
          { label: "Lesions Found", value: lesions != null ? lesions.count : "—", icon: "🔍" },
          { label: "Severity Score", value: `${severity?.score?.toFixed(2) ?? "—"} / 4.0`, icon: "📊" },
          { label: "Inference Time", value: `${(result?.inference_time ?? analysis?.inference_time)?.toFixed(2) ?? "—"}s`, icon: "⏱️" },
        ].map(m => (
          <div key={m.label} className="results-metric-card">
            <div className="rmc-icon">{m.icon}</div>
            <div className="rmc-value">{m.value}</div>
            <div className="rmc-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Two-col detail */}
      <div className="results-detail-grid">
        {/* Confidence breakdown */}
        <div className="card">
          <div className="card-header"><h3>🎯 Model Confidence</h3></div>
          <div className="card-body">
            {predEntries.length > 0 ? predEntries.map(([cls, conf], i) => (
              <div key={cls} className="pred-row">
                <span className="pred-label">{cls}</span>
                <ConfBar value={conf * 100} color={i === 0 ? color : "#94a3b8"} />
              </div>
            )) : (
              <div className="pred-row">
                <span className="pred-label">{disease}</span>
                <ConfBar value={confPct} color={color} />
              </div>
            )}
          </div>
        </div>

        {/* XAI Factors */}
        <div className="card">
          <div className="card-header"><h3>🤖 XAI Factors</h3></div>
          <div className="card-body">
            {[
              { name: "Confidence Factor", val: severity?.indicators?.confidence },
              { name: "Area Factor", val: severity?.indicators?.area },
              { name: "Lesion Factor", val: severity?.indicators?.lesions },
            ].map(f => (
              <div key={f.name} className="factor-row">
                <span className="factor-name">{f.name}</span>
                <div className="factor-bar-wrap">
                  <div className="factor-bar-track">
                    <div className="factor-bar-fill"
                      style={{ width: `${((f.val || 0) / 4) * 100}%`, background: color }} />
                  </div>
                  <span className="factor-score">{f.val ?? "—"}/4</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rec-card" style={{ borderLeft: `4px solid ${color}`, background: color + "0d" }}>
        <div className="rec-icon" style={{ color }}>
          {sev === "Healthy" ? "✅" : sev === "Critical" ? "🚨" : "⚠️"}
        </div>
        <div>
          <div className="rec-title" style={{ color }}>
            {sev === "Healthy" ? "Healthy Crop" : `${sev} — Action Required`}
          </div>
          <div className="rec-text">{REC_TEXT[sev]}</div>
        </div>
      </div>

      {/* Reasoning */}
      {severity?.reasoning && (
        <div className="reasoning-block">
          <div className="reasoning-title">💡 Analysis Explanation</div>
          <div className="reasoning-text">{severity.reasoning}</div>
        </div>
      )}

      {/* Lesions */}
      {lesions?.details?.length > 0 && (
        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-header"><h3>🔬 Detected Lesions ({lesions.count})</h3></div>
          <div className="card-body">
            <div className="lesions-grid">
              {lesions.details.map((l, i) => (
                <div key={i} className="lesion-chip">
                  <div className="lesion-num">#{i + 1}</div>
                  <div><span className="lesion-detail">Area: {l.area_percentage}%</span></div>
                  <div><span className="lesion-detail">Pos: ({l.position?.[0]}, {l.position?.[1]})</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer meta */}
      <div className="results-meta">
        {result.diagnosis_id && <span>ID: <code>{result.diagnosis_id}</code></span>}
        {result.timestamp && (
          <span>Analyzed: {new Date(result.timestamp).toLocaleString("en-IN")}</span>
        )}
      </div>
    </div>
  );
}

export default AnalysisResults;
