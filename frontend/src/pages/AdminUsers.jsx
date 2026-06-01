import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiUserPlus, FiUsers } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', phone: '' });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/auth/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created successfully!');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'employee', department: '', phone: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}>
          <FiUserPlus /> {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>➕ Create New User</div>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label className="required">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label className="required">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@company.com" required />
              </div>
              <div className="form-group">
                <label className="required">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 chars" required minLength={6} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="Sales, Engineering..." />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: u.role === 'admin' ? 'var(--gradient)' : 'rgba(108,99,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-pending'}`}>
                      {u.role === 'admin' ? '👑 Admin' : '👤 Employee'}
                    </span>
                  </td>
                  <td>{u.department || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
