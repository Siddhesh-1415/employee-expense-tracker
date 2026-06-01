import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiArrowLeft, FiCheck, FiX, FiRefreshCw, FiImage } from 'react-icons/fi';

const StatusBadge = ({ status }) => {
  const cls = { Pending:'badge badge-pending', Approved:'badge badge-approved', Rejected:'badge badge-rejected', Reimbursed:'badge badge-reimbursed' }[status] || 'badge';
  const dot = { Pending:'🟡', Approved:'🟢', Rejected:'🔴', Reimbursed:'🟣' }[status] || '⚪';
  return <span className={cls}>{dot} {status}</span>;
};

const StageBadge = ({ stage }) => {
  const labels = {
    estimate_pending:  { txt: 'Estimate Pending', color: 'var(--warning)' },
    estimate_approved: { txt: 'Estimate Approved', color: 'var(--success)' },
    actual_submitted:  { txt: 'Actual Submitted', color: 'var(--info)' },
    completed:         { txt: 'Completed', color: 'var(--accent)' },
  };
  const l = labels[stage] || { txt: stage, color: 'var(--text-muted)' };
  return <span style={{ color: l.color, fontSize: 13, fontWeight: 600 }}>{l.txt}</span>;
};

export default function ExpenseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [actualForm, setActualForm] = useState({ actualAmount: '', description: '' });
  const [actualFile, setActualFile] = useState(null);
  const [submitActual, setSubmitActual] = useState(false);

  useEffect(() => {
    api.get(`/expenses/${id}`)
      .then(r => { setExpense(r.data); setAdminNote(r.data.adminNote || ''); })
      .catch(() => toast.error('Expense not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const updated = await api.put(`/expenses/${id}/status`, { status, adminNote });
      setExpense(updated.data);
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const handleActualSubmit = async e => {
    e.preventDefault();
    setUpdating(true);
    try {
      const fd = new FormData();
      fd.append('actualAmount', actualForm.actualAmount);
      fd.append('description', actualForm.description);
      if (actualFile) fd.append('receipt', actualFile);
      const res = await api.put(`/expenses/${id}/actual`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setExpense(res.data);
      setSubmitActual(false);
      toast.success('Actual expense submitted!');
    } catch { toast.error('Submission failed'); }
    finally { setUpdating(false); }
  };

  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const isOwner = expense?.employee?._id === user?._id || expense?.employee === user?._id;

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!expense) return <div className="empty-state"><div className="empty-icon">❌</div><h3>Expense not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
            <FiArrowLeft /> Back
          </button>
          <h1>Expense Details</h1>
          <p>Submitted on {format(new Date(expense.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        <StatusBadge status={expense.status} />
      </div>

      <div className="detail-grid">
        {/* Left: Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🧾 Expense Information</span>
              {expense.isTravel && <span className="badge badge-travel">✈ Travel</span>}
            </div>
            <div className="detail-row"><span className="detail-label">Employee</span><span className="detail-value">{expense.employeeName}</span></div>
            <div className="detail-row"><span className="detail-label">Department</span><span className="detail-value">{expense.employee?.department || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Expense Type</span><span className="detail-value">{expense.expenseType}</span></div>
            <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{format(new Date(expense.date), 'dd MMMM yyyy')}</span></div>
            <div className="detail-row"><span className="detail-label">Amount</span><span className="detail-value amount-positive">{fmt(expense.amount)}</span></div>
            <div className="detail-row"><span className="detail-label">Payment Mode</span><span className="detail-value">{expense.paymentMode}</span></div>
            <div className="detail-row"><span className="detail-label">Description</span><span className="detail-value">{expense.description}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value"><StatusBadge status={expense.status} /></span></div>
          </div>

          {/* Travel Details */}
          {expense.isTravel && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--info)' }}>✈️ Travel Details</div>
              <div className="detail-row"><span className="detail-label">Client Name</span><span className="detail-value">{expense.clientName || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Purpose</span><span className="detail-value">{expense.purposeOfVisit || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">From</span><span className="detail-value">{expense.travelFrom || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">To</span><span className="detail-value">{expense.travelTo || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Estimated</span><span className="detail-value amount-warning">{fmt(expense.estimatedAmount)}</span></div>
              <div className="detail-row"><span className="detail-label">Actual</span><span className="detail-value amount-positive">{fmt(expense.actualAmount)}</span></div>
              {expense.estimatedAmount > 0 && expense.actualAmount > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Difference</span>
                  <span className="detail-value" style={{ color: expense.actualAmount > expense.estimatedAmount ? 'var(--danger)' : 'var(--success)' }}>
                    {expense.actualAmount > expense.estimatedAmount ? '↑ Over' : '↓ Under'} by {fmt(Math.abs(expense.actualAmount - expense.estimatedAmount))}
                  </span>
                </div>
              )}
              <div className="detail-row"><span className="detail-label">Stage</span><span className="detail-value"><StageBadge stage={expense.approvalStage} /></span></div>

              {/* Submit Actual Expense (employee, after travel) */}
              {isOwner && expense.approvalStage === 'estimate_approved' && (
                <div style={{ marginTop: 16 }}>
                  {!submitActual ? (
                    <button className="btn btn-primary btn-sm" onClick={() => setSubmitActual(true)}>
                      <FiRefreshCw /> Submit Actual Expenses
                    </button>
                  ) : (
                    <form onSubmit={handleActualSubmit} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="form-group">
                        <label className="required">Actual Amount (₹)</label>
                        <input type="number" required min="0" value={actualForm.actualAmount}
                          onChange={e => setActualForm(p => ({ ...p, actualAmount: e.target.value }))} placeholder="0.00" />
                      </div>
                      <div className="form-group">
                        <label>Additional Description</label>
                        <textarea value={actualForm.description} rows={2}
                          onChange={e => setActualForm(p => ({ ...p, description: e.target.value }))} placeholder="Any notes..." />
                      </div>
                      <div className="form-group">
                        <label>Receipt / Bill</label>
                        <input type="file" accept="image/*,.pdf" onChange={e => setActualFile(e.target.files[0])} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>Submit</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setSubmitActual(false)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Admin Actions + Receipt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Admin Panel */}
          {user?.role === 'admin' && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>⚙️ Admin Actions</div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Admin Note</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                  placeholder="Add note (optional)..." />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-success btn-sm" onClick={() => updateStatus('Approved')} disabled={updating}>
                  <FiCheck /> Approve
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => updateStatus('Rejected')} disabled={updating}>
                  <FiX /> Reject
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => updateStatus('Reimbursed')} disabled={updating}>
                  <FiRefreshCw /> Mark Reimbursed
                </button>
                {expense.isTravel && expense.approvalStage === 'estimate_pending' && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}
                    onClick={() => { updateStatus('Approved'); api.put(`/expenses/${id}/status`, { status: 'Approved', approvalStage: 'estimate_approved', adminNote }); }}
                    disabled={updating}>
                    ✈ Approve Estimate
                  </button>
                )}
              </div>
              {expense.adminNote && (
                <div style={{ marginTop: 14, padding: 12, background: 'rgba(108,99,255,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>Note:</strong> {expense.adminNote}
                </div>
              )}
            </div>
          )}

          {/* Receipt */}
          {expense.receipt && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📎 Receipt / Bill</div>
              {expense.receipt.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <>
                  <img
                    src={`${API_URL}/uploads/${expense.receipt}`}
                    alt="Receipt"
                    style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setShowReceipt(true)}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>Click to enlarge</div>
                </>
              ) : (
                <a href={`${API_URL}/uploads/${expense.receipt}`} target="_blank" rel="noreferrer"
                  className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  <FiImage /> View PDF Receipt
                </a>
              )}
            </div>
          )}

          {!expense.receipt && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📎 Receipt</div>
              <div className="empty-state" style={{ padding: '20px' }}>
                <div className="empty-icon" style={{ fontSize: 30 }}>🧾</div>
                <p>No receipt attached</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div onClick={() => setShowReceipt(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <img src={`${API_URL}/uploads/${expense.receipt}`} alt="Receipt full"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setShowReceipt(false)}
            style={{ position: 'fixed', top: 20, right: 20, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}
