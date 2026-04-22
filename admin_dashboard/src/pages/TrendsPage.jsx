import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import api from '../services/api';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function TrendsPage() {
  const [days, setDays]     = useState(30);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (d = days) => {
    setLoading(true);
    try {
      const r = await api.get('/admin/disease-trends', { params: { days: d } });
      setData(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(days); }, [days]);

  const chartData = data ? {
    labels: data.trends.map(x => x.disease),
    datasets: [{
      label: 'Cases', data: data.trends.map(x => x.count),
      backgroundColor: '#43a047', borderRadius: 6, borderSkipped: false,
    }],
  } : null;

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-graph-up-arrow me-2 text-success" />Disease Trends</h4>
        <select className="form-select" style={{ maxWidth: 140 }} value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 1 year</option>
        </select>
      </div>

      <div className="cc-panel">
        {loading
          ? <div className="text-center py-4"><span className="spinner-border text-success" /></div>
          : chartData && chartData.labels.length > 0
            ? <div style={{ height: 360 }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
              </div>
            : <div className="cc-empty"><i className="bi bi-bar-chart" />No data for this period</div>}
      </div>

      {data && (
        <div className="cc-panel">
          <div className="cc-panel-title">Disease Rankings (last {days} days)</div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead><tr><th>#</th><th>Disease</th><th>Cases</th><th>Avg Confidence</th></tr></thead>
              <tbody>
                {data.trends.map((t, i) => (
                  <tr key={t.disease}>
                    <td className="text-muted small">{i + 1}</td>
                    <td className="fw-semibold small">{t.disease}</td>
                    <td><span className="badge bg-success">{t.count}</span></td>
                    <td className="small">{t.avg_confidence_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
