const express = require('express');
const router = express.Router();
const {
  createExpense, getExpenses, getExpenseById,
  updateStatus, submitActual, deleteExpense, getSummary,
} = require('../controllers/expenseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/summary', protect, getSummary);
router.route('/')
  .get(protect, getExpenses)
  .post(protect, upload.single('receipt'), createExpense);

router.route('/:id')
  .get(protect, getExpenseById)
  .delete(protect, deleteExpense);

router.put('/:id/status', protect, adminOnly, updateStatus);
router.put('/:id/actual', protect, upload.single('receipt'), submitActual);

module.exports = router;
