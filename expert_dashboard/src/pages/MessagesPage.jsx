import React, { useState, useEffect } from 'react';
import api from '../services/api';

function fmtDate(s) { if (!s) return '—'; return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/expert/messages');
      setMessages(r.data.messages || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-chat-dots-fill me-2 text-primary" />Sent Messages</h4>
        <button className="btn btn-brand btn-sm" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
      </div>

      {loading
        ? <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
        : messages.length === 0
          ? <div className="cc-empty"><i className="bi bi-chat" />No messages sent yet</div>
          : (
            <div className="d-flex flex-column gap-3">
              {messages.map(m => (
                <div key={m.id} className="cc-panel">
                  <div className="d-flex justify-content-between mb-1">
                    <div>
                      <span className="fw-semibold">{m.farmer_name || 'Farmer'}</span>
                      {m.farmer_phone && <span className="text-muted small ms-2">{m.farmer_phone}</span>}
                    </div>
                    <span className="text-muted small">{fmtDate(m.created_at)}</span>
                  </div>
                  {m.subject && <div className="fw-bold small mb-1">{m.subject}</div>}
                  <p className="mb-1 small">{m.message}</p>
                  {m.analysis_id && (
                    <span className="badge bg-light text-dark border small">
                      <i className="bi bi-file-earmark me-1" />Analysis #{String(m.analysis_id).slice(0, 8)}…
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
    </>
  );
}
