import React, { useEffect, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import api from '../services/api';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PALETTE = ['#43a047','#e53935','#fb8c00','#1e88e5','#8e24aa','#00acc1','#f4511e','#3949ab'];
const SEV_COLORS = { Healthy:'#43a047', Mild:'#fdd835', Moderate:'#fb8c00', Severe:'#e53935', Critical:'#880e4f' };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{height:'60vh'}}><div className="spinner-border text-success" /></div>;
  if (!stats)  return <div className="alert alert-danger">Failed to load stats.</div>;

  const diseaseChart = {
    labels: stats.disease_distribution.map(x => x.disease),
    datasets: [{ data: stats.disease_distribution.map(x => x.count), backgroundColor: PALETTE, borderWidth: 2 }],
  };

  const sevLabels = stats.severity_distribution.map(x => x.severity);
  const severityChart = {
    labels: sevLabels,
    datasets: [{ label: 'Cases', data: stats.severity_distribution.map(x => x.count),
      backgroundColor: sevLabels.map(s => SEV_COLORS[s] || '#90a4ae'), borderRadius: 6 }],
  };

  const cards = [
    { label: 'Total Users',     val: stats.total_users,             sub: 'farmers + experts',     cls: '' },
    { label: 'Experts',         val: stats.total_experts,           sub: 'review accounts',        cls: 'info' },
    { label: 'Total Analyses',  val: stats.total_analyses,          sub: 'all time',               cls: '' },
    { label: 'Pending Reviews', val: stats.pending_expert_reviews,  sub: 'awaiting expert',        cls: 'warn' },
    { label: 'Active Users',    val: stats.active_users,            sub: '',                       cls: '' },
    { label: 'This Week',       val: stats.recent_analyses_7d,      sub: 'new analyses',           cls: 'info' },
  ];

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-grid-fill me-2 text-success" />Dashboard</h4>
      </div>

      <div className="row g-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="col-md-4 col-xl-2">
            <div className={`cc-stat ${c.cls}`}>
              <div className="cc-stat-label">{c.label}</div>
              <div className="cc-stat-val">{c.val}</div>
              {c.sub && <div className="cc-stat-sub">{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="cc-panel">
            <div className="cc-panel-title"><i className="bi bi-pie-chart-fill me-2 text-success" />Disease Distribution</div>
            <div className="chart-wrap">
              <Doughnut data={diseaseChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="cc-panel">
            <div className="cc-panel-title"><i className="bi bi-bar-chart-fill me-2 text-warning" />Severity Breakdown</div>
            <div className="chart-wrap">
              <Bar data={severityChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
