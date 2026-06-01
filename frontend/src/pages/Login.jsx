import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="login-page">
      <div className="login-bg-orb one" />
      <div className="login-bg-orb two" />

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">💰</div>
          <h1>ExpenseTrack</h1>
          <p>Sign in to your company account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="you@company.com"
                style={{ paddingLeft: 38 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password" name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                required
              />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>Demo Accounts</h4>
          <div className="demo-row">
            <span>👑 Admin</span>
            <span onClick={() => fillDemo('admin@company.com', 'admin123')}>admin@company.com / admin123</span>
          </div>
          <div className="demo-row">
            <span>👤 Employee</span>
            <span onClick={() => fillDemo('rahul@company.com', 'emp123')}>rahul@company.com / emp123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
