/**
 * Backfill realistic audit logs from existing applications + admin login
 * Run: node scripts/seed-audit-logs.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Application = require('../models/Application');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const auditService = require('../utils/auditService');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

async function main() {
  await mongoose.connect(mongoUri);

  const existing = await AuditLog.countDocuments({
    action: { $in: ['APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_CREATED'] },
  });
  if (existing >= 5) {
    console.log(`Already have ${existing} application audit logs — skip backfill.`);
    await mongoose.disconnect();
    return;
  }

  const admin =
    (await User.findOne({ role: 'admin', email: 'admin@housing.gov.eg' })) ||
    (await User.findOne({ role: 'admin' }));

  if (admin) {
    await auditService.logLogin(admin, null, true);
    console.log('Logged admin login');
  }

  const apps = await Application.find({}).sort({ createdAt: 1 });
  for (const app of apps) {
    await auditService.logApplicationCreated(app, null);

    if ((app.status === 'approved' || app.status === 'rejected') && app.reviewedAt) {
      await auditService.logApplicationStatusChange(
        app,
        'pending',
        { name: app.reviewedBy || admin?.name || 'Admin', role: 'admin', id: admin?._id },
        null
      );
    }
    console.log(`  ${app.name} — ${app.status}`);
  }

  const total = await AuditLog.countDocuments();
  console.log(`Done. Total audit logs: ${total}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
