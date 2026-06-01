const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, required: true },
  expenseType: {
    type: String,
    enum: ['Food', 'Local Travel', 'Train/Flight', 'Hotel', 'Miscellaneous'],
    required: true,
  },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
  receipt: { type: String, default: null }, // file path

  // Travel-specific fields
  isTravel: { type: Boolean, default: false },
  clientName: { type: String, default: '' },
  purposeOfVisit: { type: String, default: '' },
  travelFrom: { type: String, default: '' },
  travelTo: { type: String, default: '' },
  estimatedAmount: { type: Number, default: 0 },
  actualAmount: { type: Number, default: 0 },

  // Workflow
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Reimbursed'],
    default: 'Pending',
  },
  approvalStage: {
    type: String,
    enum: ['estimate_pending', 'estimate_approved', 'actual_submitted', 'completed'],
    default: 'estimate_pending',
  },
  adminNote: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
