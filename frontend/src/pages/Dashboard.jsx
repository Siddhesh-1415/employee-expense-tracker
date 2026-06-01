import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiDollarSign, FiClock, FiCheckCircle, FiXCircle,
  FiTrendingUp, FiPlusCircle, FiList,
} from 'react-icons/fi';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6c63ff','#00d68f','#ffb84d','#ff5c6e','#2ec4f1','#9d4edd'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/expenses/summary')
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false));
  }, []);

  const getTotal = (status) => {
    if (!summary) return 0;
    const found = summary.totals.find(t => t._id === status);
    return found ? found.total : 0;
  };
  const getCount = (status) => {
    if (!summary) return 0;
    const found = summary.totals.find(t => t._id === status);
    return found ? found.count : 0;
  };
  const totalAll = summary ? summary.totals.reduce((a, t) => a + t.total, 0) : 0;
  const countAll = summary ? summary.totals.reduce((a, t) => a + t.count, 0) : 0;

  const monthlyData = (summary?.monthly || []).map(m => ({
    name: MONTHS[m._id.month - 1],
    amount: m.total,
    count: m.count,
  }));

  const categoryData = (summary?.byCategory || []).map((c, i) => ({
    name: c._id, value: c.total, count: c.count, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name} 👋 Here's your expense overview.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/expenses/new')}>
          <FiPlusCircle /> New Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card purple">
          <div className="card-icon"><FiDollarSign /></div>
          <div className="card-value">{fmt(totalAll)}</div>
          <div className="card-label">Total Expenses ({countAll})</div>
        </div>
        <div className="summary-card orange">
          <div className="card-icon"><FiClock /></div>
          <div className="card-value">{fmt(getTotal('Pending'))}</div>
          <div className="card-label">Pending ({getCount('Pending')})</div>
        </div>
        <div className="summary-card green">
          <div className="card-icon"><FiCheckCircle /></div>
          <div className="card-value">{fmt(getTotal('Approved'))}</div>
          <div className="card-label">Approved ({getCount('Approved')})</div>
        </div>
        <div className="summary-card red">
          <div className="card-icon"><FiXCircle /></div>
          <div className="card-value">{fmt(getTotal('Rejected'))}</div>
          <div className="card-label">Rejected ({getCount('Rejected')})</div>
        </div>
        <div className="summary-card blue">
          <div className="card-icon"><FiTrendingUp /></div>
          <div className="card-value">{fmt(getTotal('Reimbursed'))}</div>
          <div className="card-label">Reimbursed ({getCount('Reimbursed')})</div>
        </div>
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">📈 Monthly Expense Trend</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
                <XAxis dataKey="name" tick={{ fill: '#8b92b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b92b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2f4a', borderRadius: 8 }}
                  labelStyle={{ color: '#e8eaf6' }}
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6c63ff" strokeWidth={2} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">🍕 By Category</div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3}>
                    {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2f4a', borderRadius: 8 }}
                    formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Legend formatter={(v) => <span style={{ color: '#8b92b8', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><div className="empty-icon">📊</div><p>No data yet</p></div>
            )}
          </div>
        </div>
      )}

      {/* Category Bar Chart */}
      {categoryData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 28 }}>
          <div className="chart-title">📊 Expense by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#8b92b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8b92b8', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2f4a', borderRadius: 8 }}
                formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-outline" onClick={() => navigate('/expenses')}>
          <FiList /> View All Expenses
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/expenses/new')}>
          <FiPlusCircle /> Add New Expense
        </button>
      </div>
    </div>
  );
}
