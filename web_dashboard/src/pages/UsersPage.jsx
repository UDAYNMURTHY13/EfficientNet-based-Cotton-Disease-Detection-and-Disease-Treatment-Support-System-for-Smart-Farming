import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { apiService } from '../services/api';
import '../styles/pages.css';

const UsersPage = () => {
  const { users, setUsers, loading, setLoading } = useContext(DataContext);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'expert' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createUser(formData);
      setFormData({ name: '', email: '', role: 'expert' });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure?')) {
      setLoading(true);
      try {
        await apiService.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !showForm) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="expert">Expert</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-submit">
              Create User
            </button>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  className="action-btn delete"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
