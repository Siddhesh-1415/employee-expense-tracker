import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUpload, FiArrowLeft, FiSend } from 'react-icons/fi';

const EXPENSE_TYPES = ['Food', 'Local Travel', 'Train/Flight', 'Hotel', 'Miscellaneous'];
const TRAVEL_TYPES = ['Train/Flight', 'Local Travel', 'Hotel'];

export default function AddExpense() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [form, setForm] = useState({
    expenseType: 'Food',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    paymentMode: 'Cash',
    isTravel: false,
    clientName: '',
    purposeOfVisit: '',
    travelFrom: '',
    travelTo: '',
    estimatedAmount: '',
    actualAmount: '',
  });

  const isTravel = form.isTravel;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (receiptFile) fd.append('receipt', receiptFile);
      await api.post('/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Expense submitted successfully! 🎉');
      navigate('/expenses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
            <FiArrowLeft /> Back
          </button>
          <h1>Add New Expense</h1>
          <p>Fill in the details below to submit your expense.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🧾 Basic Information
          </div>

          {/* Travel toggle */}
          <div className="toggle-row">
            <input type="checkbox" id="isTravel" name="isTravel" checked={form.isTravel}
              onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
            <label htmlFor="isTravel" className="toggle-label" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14 }}>
              ✈️ This is a <strong>Travel Expense</strong> (requires approval workflow)
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="required">Expense Type</label>
              <select name="expenseType" value={form.expenseType} onChange={handleChange} required>
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="required">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="form-group">
              <label className="required">Amount (₹)</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange}
                placeholder="0.00" min="0" step="0.01" required />
            </div>

            <div className="form-group">
              <label className="required">Payment Mode</label>
              <select name="paymentMode" value={form.paymentMode} onChange={handleChange} required>
                {['Cash', 'UPI', 'Card'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-group full">
              <label className="required">Description / Purpose</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Describe the purpose of this expense..." required rows={3} />
            </div>
          </div>
        </div>

        {/* Travel Section */}
        {isTravel && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--info)' }}>
              ✈️ Travel Details
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
              Travel expenses require manager approval before booking. Submit estimated cost first.
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label className="required">Client / Vendor Name</label>
                <input name="clientName" value={form.clientName} onChange={handleChange}
                  placeholder="Client name" required={isTravel} />
              </div>

              <div className="form-group">
                <label className="required">Purpose of Visit</label>
                <input name="purposeOfVisit" value={form.purposeOfVisit} onChange={handleChange}
                  placeholder="Meeting, audit, sales visit..." required={isTravel} />
              </div>

              <div className="form-group">
                <label className="required">Travel From</label>
                <input name="travelFrom" value={form.travelFrom} onChange={handleChange}
                  placeholder="City / Location" required={isTravel} />
              </div>

              <div className="form-group">
                <label className="required">Travel To</label>
                <input name="travelTo" value={form.travelTo} onChange={handleChange}
                  placeholder="City / Location" required={isTravel} />
              </div>

              <div className="form-group">
                <label className="required">Estimated Amount (₹)</label>
                <input type="number" name="estimatedAmount" value={form.estimatedAmount}
                  onChange={handleChange} placeholder="0.00" min="0" required={isTravel} />
              </div>

              <div className="form-group">
                <label>Actual Amount (₹) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(after travel)</span></label>
                <input type="number" name="actualAmount" value={form.actualAmount}
                  onChange={handleChange} placeholder="Fill after travel" min="0" />
              </div>
            </div>
          </div>
        )}

        {/* Receipt Upload */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            📎 Upload Receipt / Bill
          </div>
          <div className="file-upload-area" onClick={() => document.getElementById('receipt').click()}>
            <input type="file" id="receipt" name="receipt" accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={e => setReceiptFile(e.target.files[0])} />
            <div className="file-upload-icon">
              {receiptFile ? '✅' : <FiUpload style={{ fontSize: 28, color: 'var(--accent)' }} />}
            </div>
            <div className="file-upload-text">
              {receiptFile ? receiptFile.name : 'Click to upload or drag & drop'}
            </div>
            <div className="file-upload-hint">JPEG, PNG, PDF up to 5MB</div>
          </div>
          {receiptFile && (
            <div style={{ margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ {receiptFile.name}</span>
              <button type="button" className="btn btn-outline btn-sm"
                onClick={() => setReceiptFile(null)} style={{ padding: '3px 8px', fontSize: 11 }}>Remove</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FiSend />
            {loading ? 'Submitting...' : isTravel ? 'Submit for Approval' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
