const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  await User.deleteMany({});

  const users = [
    { name: 'Admin User',  email: 'admin@company.com',  password: 'admin123',  role: 'admin',    department: 'HR' },
    { name: 'Rahul Sharma', email: 'rahul@company.com', password: 'emp123', role: 'employee', department: 'Sales' },
    { name: 'Priya Singh',  email: 'priya@company.com', password: 'emp123', role: 'employee', department: 'Engineering' },
    { name: 'Amit Verma',   email: 'amit@company.com',  password: 'emp123', role: 'employee', department: 'Marketing' },
  ];

  for (const u of users) await User.create(u);
  console.log('✅ Seeded', users.length, 'users');
  console.log('\nDefault credentials:');
  console.log('  Admin  → admin@company.com / admin123');
  console.log('  Emp    → rahul@company.com / emp123');
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
