import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  FiSearch, FiPlusCircle, FiEye, FiTrash2,
  FiChevronLeft, FiChevronRight, FiDownload,
} from 'react-icons/fi';

const STATUS_OPTIONS = ['', 'Pending', 'Approved', 'Rejected', 'Reimbursed'];
const TYPE_OPTIONS = ['', 'Food', 'Local Travel', 'Train/Flight', 'Hotel', 'Miscellaneous'];

const StatusBadge = ({ status }) => {
  const cls = {
    Pending: 'badge badge-pending',
    Approved: 'badge badge-approved',
    Rejected: 'badge badge-rejected',
    Reimbursed: 'badge badge-reimbursed',
  }[status] || 'badge';
  const dot = { Pending: '🟡', Approved: '🟢', Rejected: '🔴', Reimbursed: '🟣' }[status] || '⚪';
  return <span className={cls}>{dot} {status}</span>;
};

export default function ExpenseList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get('/expenses', { params });
      setExpenses(data.expenses);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.put(`/expenses/${id}/status`, { status });
      toast.success(`Marked as ${status}`);
      fetchExpenses();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      fetchExpenses();
    } catch {
      toast.error('Delete failed');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Employee', 'Type', 'Description', 'Amount', 'Payment', 'Status'];
    const rows = expenses.map(e => [
      format(new Date(e.date), 'dd MMM yyyy'),
      e.employeeName,
      e.expenseType,
      e.description,
      e.amount,
      e.paymentMode,
      e.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenses_${Date.now()}.csv`; a.click();
  };

  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{user?.role === 'admin' ? 'All Expenses' : 'My Expenses'}</h1>
          <p>{total} record{total !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <FiDownload /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/expenses/new')}>
            <FiPlusCircle /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <FiSearch className="search-icon" />
          <input
            placeholder="Search by employee, description, client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>No expenses found</h3>
            <p>Try adjusting filters or add a new expense.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {user?.role === 'admin' && <th>Employee</th>}
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp._id}>
                    <td>
                      <div>{format(new Date(exp.date), 'dd MMM yyyy')}</div>
                      {exp.isTravel && <span className="badge badge-travel" style={{ fontSize: 10, padding: '2px 6px' }}>✈ Travel</span>}
                    </td>
                    {user?.role === 'admin' && (
                      <td>
                        <div style={{ fontWeight: 500 }}>{exp.employeeName}</div>
                        <div className="td-muted">{exp.employee?.department}</div>
                      </td>
                    )}
                    <td>{exp.expenseType}</td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.description}
                      </div>
                      {exp.isTravel && exp.clientName && (
                        <div className="td-muted">Client: {exp.clientName}</div>
                      )}
                    </td>
                    <td>
                      <div className="amount-positive">{fmt(exp.amount)}</div>
                      {exp.isTravel && exp.estimatedAmount ? (
                        <div className="td-muted">Est: {fmt(exp.estimatedAmount)}</div>
                      ) : null}
                    </td>
                    <td>{exp.paymentMode}</td>
                    <td>
                      {user?.role === 'admin' ? (
                        <select
                          className="status-select"
                          value={exp.status}
                          disabled={updatingId === exp._id}
                          onChange={e => handleStatusChange(exp._id, e.target.value)}
                        >
                          {['Pending', 'Approved', 'Rejected', 'Reimbursed'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={exp.status} />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/expenses/${exp._id}`)}>
                          <FiEye />
                        </button>
                        {(user?.role === 'admin' || exp.employee?._id === user?._id) && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp._id)}>
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <FiChevronLeft />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
