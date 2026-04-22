import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [role, setRole]           = useState('');
  const [isActive, setIsActive]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [editRole, setEditRole]   = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editMsg, setEditMsg]     = useState('');
  const debounceRef = useRef(null);
  const PER = 20;

  const load = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, per_page: PER };
      if (search)   params.search = search;
      if (role)     params.role = role;
      if (isActive) params.is_active = isActive;
      const r = await api.get('/admin/users', { params });
      setUsers(r.data.users); setTotal(r.data.total);
    } finally { setLoading(false); }
  }, [page, search, role, isActive]);

  useEffect(() => { load(page); }, [page, role, isActive]);

  const handleSearchChange = (v) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1); }, 350);
  };

  const openEdit = (u) => { setEditUser(u); setEditRole(u.role); setEditActive(u.is_active); setEditMsg(''); };

  const saveEdit = async () => {
    try {
      await api.patch(`/admin/users/${editUser.id}`, { role: editRole, is_active: editActive });
      setEditUser(null); load(page);
    } catch (e) { setEditMsg(e.response?.data?.detail || 'Update failed'); }
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${id}`);
    load(page);
  };

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-people-fill me-2 text-success" />User Management</h4>
      </div>

      <div className="cc-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <input className="form-control" style={{ maxWidth: 240 }} placeholder="Search email / name / phone…"
            value={search} onChange={e => handleSearchChange(e.target.value)} />
          <select className="form-select" style={{ maxWidth: 140 }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="farmer">Farmer</option>
            <option value="expert">Expert</option>
            <option value="admin">Admin</option>
          </select>
          <select className="form-select" style={{ maxWidth: 140 }} value={isActive} onChange={e => { setIsActive(e.target.value); setPage(1); }}>
            <option value="">Any Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn btn-brand btn-sm ms-auto" onClick={() => load(page)}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4"><span className="spinner-border text-success" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead><tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Role</th>
                <th>Status</th><th>District</th><th>Analyses</th><th>Joined</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {users.length === 0
                  ? <tr><td colSpan={9}><div className="cc-empty"><i className="bi bi-people" />No users found</div></td></tr>
                  : users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.first_name} {u.last_name || ''}</td>
                      <td className="text-muted small">{u.email}</td>
                      <td className="small">{u.phone || '—'}</td>
                      <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                      <td><span className={`dot-${u.is_active ? 'on' : 'off'}`} />{u.is_active ? 'Active' : 'Inactive'}</td>
                      <td className="small text-muted">{u.district || '—'}</td>
                      <td className="text-center">{u.analyses_count}</td>
                      <td className="small text-muted">{fmtDate(u.created_at)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(u)}><i className="bi bi-pencil" /></button>
                        {u.role !== 'admin' && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deactivate(u.id)}><i className="bi bi-person-x" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="text-muted small">Showing {(page - 1) * PER + 1}–{Math.min(page * PER, total)} of {total}</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page * PER >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: '#e8f5e9' }}>
                <h5 className="modal-title text-success fw-bold"><i className="bi bi-pencil-fill me-2" />Edit User</h5>
                <button className="btn-close" onClick={() => setEditUser(null)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">{editUser.email}</p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Role</label>
                  <select className="form-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="farmer">Farmer</option>
                    <option value="expert">Expert</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Status</label>
                  <select className="form-select" value={String(editActive)} onChange={e => setEditActive(e.target.value === 'true')}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                {editMsg && <div className="alert alert-danger py-2 small">{editMsg}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(null)}>Cancel</button>
                <button className="btn btn-brand btn-sm" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
