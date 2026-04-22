import React, { useState } from 'react';
import api from '../services/api';

export default function CreateExpertPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' });
  const [msg, setMsg]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null); setLoading(true);
    try {
      const r = await api.post('/admin/create-expert', form);
      setMsg({ type: 'success', text: `Expert account created! Email: ${r.data.email}` });
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to create expert' });
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-person-plus-fill me-2 text-success" />Create Expert Account</h4>
      </div>

      <div className="cc-panel" style={{ maxWidth: 500 }}>
        <p className="text-muted small mb-4">
          Expert accounts can review AI analyses, add treatment recommendations, and contact farmers.
        </p>

        {msg && <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">First Name <span className="text-danger">*</span></label>
              <input className="form-control" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Dr. Ravi" required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Last Name</label>
              <input className="form-control" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Kumar" />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Email <span className="text-danger">*</span></label>
              <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} placeholder="expert@cottoncare.ai" required />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Password <span className="text-danger">*</span></label>
              <input type="password" className="form-control" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" required minLength={8} />
            </div>
            <div className="col-12 mt-2">
              <button className="btn btn-brand w-100 fw-semibold" type="submit" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-1" />}
                Create Expert Account
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
