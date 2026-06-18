/**
 * Audit users vs applications in MongoDB
 * Run: node scripts/audit-users-applications.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

const ADMIN_EMAIL_PATTERNS = [
  /^admin@/i,
  /@housing\.gov\.eg$/i,
  /@housing\.com$/i,
];

async function main() {
  await mongoose.connect(mongoUri);
  const users = await User.find({}).select('-password').lean();
  const apps = await Application.find({}).lean();

  const userByEmail = new Map(users.map((u) => [(u.email || '').toLowerCase(), u]));
  const userByNid = new Map(users.map((u) => [(u.nationalId || '').trim(), u]));

  console.log('\n=== USERS (' + users.length + ') ===');
  const issues = [];

  users.forEach((u) => {
    const email = (u.email || '').toLowerCase();
    const looksAdminEmail = ADMIN_EMAIL_PATTERNS.some((p) => p.test(email));
    if (looksAdminEmail && u.role === 'citizen') {
      issues.push({
        type: 'citizen_with_staff_email',
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        nationalId: u.nationalId,
      });
    }
  });

  console.log('\n=== APPLICATIONS (' + apps.length + ') ===');
  const orphanApps = [];
  const emailMismatch = [];

  apps.forEach((app) => {
    const email = (app.email || '').toLowerCase();
    const nid = (app.nationalId || '').trim();
    const userByE = userByEmail.get(email);
    const userByN = userByNid.get(nid);

    if (!userByE && !userByN) {
      orphanApps.push({
        appId: app._id,
        name: app.name,
        email: app.email,
        nationalId: app.nationalId,
      });
      return;
    }

    const user = userByE || userByN;
    if (userByE && userByN && String(userByE._id) !== String(userByN._id)) {
      emailMismatch.push({
        appId: app._id,
        appEmail: app.email,
        appNid: app.nationalId,
        userEmail: userByE.email,
        userNid: userByE.nationalId,
        otherUser: userByN.email,
      });
    }

    const looksAdminEmail = ADMIN_EMAIL_PATTERNS.some((p) => p.test(email));
    if (looksAdminEmail && user.role === 'citizen') {
      issues.push({
        type: 'app_tied_to_citizen_with_staff_email',
        appId: app._id,
        appName: app.name,
        appEmail: app.email,
        userId: user._id,
        userRole: user.role,
      });
    }
  });

  console.log('\n--- Citizen with admin/staff-like email ---');
  issues
    .filter((i) => i.type === 'citizen_with_staff_email')
    .forEach((i) => console.log(JSON.stringify(i, null, 2)));

  console.log('\n--- Applications with no matching user ---');
  orphanApps.forEach((o) => console.log(JSON.stringify(o)));

  console.log('\n--- Email/NationalId point to different users ---');
  emailMismatch.forEach((m) => console.log(JSON.stringify(m)));

  console.log('\n--- All users summary ---');
  users.forEach((u) => {
    const hasApp = apps.some(
      (a) =>
        (a.email || '').toLowerCase() === (u.email || '').toLowerCase() ||
        (a.nationalId || '').trim() === (u.nationalId || '').trim()
    );
    console.log(
      `${u.role.padEnd(8)} | ${(u.email || '').padEnd(35)} | ${u.name} | app:${hasApp ? 'yes' : 'no'} | status:${u.status || 'active'}`
    );
  });

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
