/**
 * Upsert realistic government employee accounts (keeps existing users).
 * Run: node scripts/seed-employees.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/housing-system';

const EMPLOYEES = [
  {
    name: 'Nour Hassan El-Sayed',
    email: 'nour.hassan@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110001',
    nationalId: '29110000000001',
    role: 'employee',
    department: 'Housing Review',
    status: 'active',
    isVerified: true,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    name: 'Yasmin Farouk Abdel Nasser',
    email: 'yasmin.finance@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110002',
    nationalId: '29110000000002',
    role: 'employee',
    department: 'Finance',
    status: 'active',
    isVerified: true,
    lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    name: 'Khaled Mahmoud Osman',
    email: 'khaled.support@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110003',
    nationalId: '29110000000003',
    role: 'employee',
    department: 'Support',
    status: 'active',
    isVerified: true,
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    name: 'Heba Salah Ibrahim',
    email: 'heba.complaints@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110004',
    nationalId: '29110000000004',
    role: 'employee',
    department: 'Complaints',
    status: 'active',
    isVerified: true,
    lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Tarek Adel Mostafa',
    email: 'tarek.administration@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110005',
    nationalId: '29110000000005',
    role: 'employee',
    department: 'Administration',
    status: 'active',
    isVerified: true,
    lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    name: 'Dina Kamal Fathy',
    email: 'dina.review@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110006',
    nationalId: '29110000000006',
    role: 'employee',
    department: 'Housing Review',
    status: 'inactive',
    isVerified: true,
    lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

async function upsertEmployee(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    existing.name = data.name;
    existing.phone = data.phone;
    existing.role = 'employee';
    existing.department = data.department;
    existing.status = data.status;
    existing.isVerified = data.isVerified;
    existing.lastLogin = data.lastLogin;
    if (data.password) existing.password = data.password;
    await existing.save();
    return 'updated';
  }
  await User.create(data);
  return 'created';
}

async function main() {
  await mongoose.connect(mongoUri);
  let created = 0;
  let updated = 0;
  for (const emp of EMPLOYEES) {
    const result = await upsertEmployee(emp);
    if (result === 'created') created += 1;
    else updated += 1;
    console.log(`  ${result === 'created' ? '✅' : '🔄'} ${emp.name} — ${emp.department}`);
  }
  const counts = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  console.log('\nRole counts:', counts);
  console.log(`Done: ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
