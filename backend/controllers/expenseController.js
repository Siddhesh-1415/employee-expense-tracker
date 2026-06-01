const Expense = require('../models/Expense');
const path = require('path');

// @desc  Create new expense
// @route POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const {
      expenseType, date, amount, description, paymentMode,
      isTravel, clientName, purposeOfVisit, travelFrom, travelTo,
      estimatedAmount, actualAmount,
    } = req.body;

    const receipt = req.file ? req.file.filename : null;

    const expense = await Expense.create({
      employee: req.user._id,
      employeeName: req.user.name,
      expenseType,
      date,
      amount,
      description,
      paymentMode,
      receipt,
      isTravel: isTravel === 'true' || isTravel === true,
      clientName, purposeOfVisit, travelFrom, travelTo,
      estimatedAmount: estimatedAmount || 0,
      actualAmount: actualAmount || 0,
      approvalStage: isTravel === 'true' || isTravel === true ? 'estimate_pending' : 'completed',
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get expenses (employee sees own, admin sees all)
// @route GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role !== 'admin') query.employee = req.user._id;
    if (status) query.status = status;
    if (type) query.expenseType = type;
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('employee', 'name email department');

    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get single expense
// @route GET /api/expenses/:id
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('employee', 'name email department');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (req.user.role !== 'admin' && expense.employee._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update expense status (admin)
// @route PUT /api/expenses/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status, adminNote, approvalStage } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (status) expense.status = status;
    if (adminNote !== undefined) expense.adminNote = adminNote;
    if (approvalStage) expense.approvalStage = approvalStage;
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();

    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Submit actual expense after travel (employee)
// @route PUT /api/expenses/:id/actual
const submitActual = async (req, res) => {
  try {
    const { actualAmount, description } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.employee.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    expense.actualAmount = actualAmount;
    if (description) expense.description = description;
    const receipt = req.file ? req.file.filename : expense.receipt;
    expense.receipt = receipt;
    expense.approvalStage = 'actual_submitted';
    expense.status = 'Pending';
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete expense
// @route DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (req.user.role !== 'admin' && expense.employee.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Dashboard summary
// @route GET /api/expenses/summary
const getSummary = async (req, res) => {
  try {
    const matchStage = req.user.role === 'admin' ? {} : { employee: req.user._id };

    const [totals, byCategory, monthly] = await Promise.all([
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: matchStage },
        { $group: { _id: '$expenseType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({ totals, byCategory, monthly });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createExpense, getExpenses, getExpenseById, updateStatus, submitActual, deleteExpense, getSummary };
