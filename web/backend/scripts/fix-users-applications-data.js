/**
 * Fix user/application data consistency in MongoDB:
 * - Citizen with admin-like email → proper citizen email
 * - nationalId conflicts between user and application → resolve
 * - Create missing citizen users for orphan applications
 * - Ensure canonical admin account exists
 *
 * Run: node scripts/fix-users-applications-data.js
 * Dry run: node scripts/fix-users-applications-data.js --dry-run
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

const DRY_RUN = process.argv.includes('--dry-run');

const RESERVED_ADMIN_EMAILS = new Set([
  'admin@housing.gov.eg',
  'sarah.admin@housing.com',
]);

const log = (msg) => console.log(DRY_RUN ? `[DRY] ${msg}` : msg);

async function upsertAdmin() {
  const email = 'admin@housing.gov.eg';
  let admin = await User.findOne({ email });
  if (!admin) {
    log(`Create canonical admin: ${email}`);
    if (!DRY_RUN) {
      await User.create({
        name: 'System Administrator',
        email,
        password: 'admin123',
        phone: '01000000000',
        nationalId: '29000000000000',
        role: 'admin',
        department: 'Administration',
        status: 'active',
        isVerified: true,
      });
    }
  } else if (admin.role !== 'admin') {
    log(`Fix role for ${email} → admin`);
    if (!DRY_RUN) {
      admin.role = 'admin';
      admin.department = 'Administration';
      await admin.save();
    }
  }
}

async function fixCitizenWithAdminEmail() {
  const bad = await User.findOne({ email: 'admin@housing.com', role: 'citizen' });
  if (!bad) return;

  const newEmail = 'ahmed.mohamed@email.com';
  const conflict = await User.findOne({ email: newEmail });
  const email = conflict ? `ahmed.mohamed.${Date.now()}@email.com` : newEmail;

  log(`Fix citizen mistaken email: admin@housing.com → ${email} (${bad.name})`);

  const appByNid = await Application.findOne({ nationalId: bad.nationalId });
  if (appByNid && appByNid.email?.toLowerCase() !== email.toLowerCase()) {
    log(`  User nationalId ${bad.nationalId} used by app "${appByNid.name}" (${appByNid.email}) — assign new nationalId to user`);
    const newNid = '28112345678901';
    if (!DRY_RUN) {
      bad.nationalId = newNid;
      bad.email = email;
      bad.status = 'active';
      await bad.save();
    }
  } else if (!DRY_RUN) {
    bad.email = email;
    bad.status = 'active';
    await bad.save();
  }
}

async function fixNationalIdMismatches() {
  const users = await User.find({ role: 'citizen' }).lean();
  const apps = await Application.find({}).lean();

  for (const user of users) {
    const nid = (user.nationalId || '').trim();
    if (!nid) continue;
    const app = apps.find((a) => (a.nationalId || '').trim() === nid);
    if (!app) continue;

    const userEmail = (user.email || '').toLowerCase();
    const appEmail = (app.email || '').toLowerCase();
    if (userEmail === appEmail) continue;

    log(
      `nationalId clash: user ${user.email} ≠ app ${app.email} (${app.name}) — clear user nid ${nid}`
    );
    if (!DRY_RUN) {
      const suffix = String(user._id).replace(/\D/g, '').slice(-12).padStart(12, '0');
      const newNid = (`28${suffix}`).slice(0, 14);
      await User.updateOne({ _id: user._id }, { $set: { nationalId: newNid } });
    }
  }
}

async function createUsersForOrphanApplications() {
  const apps = await Application.find({}).lean();

  for (const app of apps) {
    const email = (app.email || '').trim().toLowerCase();
    const nid = (app.nationalId || '').trim();
    if (!email || !nid) continue;

    if (RESERVED_ADMIN_EMAILS.has(email) || /^admin@/i.test(email)) {
      log(`Skip app ${app._id}: reserved/staff-like email ${email}`);
      continue;
    }

    const existing = await User.findOne({
      $or: [{ email }, { nationalId: nid }],
    });

    if (existing) {
      const exEmail = (existing.email || '').toLowerCase();
      if (exEmail !== email) {
        log(`Link app ${email} — user exists as ${exEmail} (update app email to match user)`);
        if (!DRY_RUN) {
          await Application.updateOne(
            { _id: app._id },
            { $set: { email: existing.email, name: existing.name || app.name } }
          );
        }
      }
      continue;
    }

    log(`Create citizen for application: ${app.name} <${email}>`);
    if (!DRY_RUN) {
      await User.create({
        name: app.name,
        email,
        password: 'Citizen@123',
        phone: app.phone || '01000000001',
        nationalId: nid,
        role: 'citizen',
        status: 'active',
        isVerified: true,
      });
    }
  }
}

async function fixWrongStaffEmails() {
  const wrong = await User.findOne({ email: 'mohamed@gamil.com', role: 'employee' });
  if (wrong) {
    log('Fix mohamed@gamil.com: employee → citizen (test account)');
    if (!DRY_RUN) {
      wrong.role = 'citizen';
      wrong.department = undefined;
      await wrong.save();
    }
  }
}

async function main() {
  await mongoose.connect(mongoUri);
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== APPLYING FIXES ===');

  await upsertAdmin();
  await fixCitizenWithAdminEmail();
  await fixNationalIdMismatches();
  await fixWrongStaffEmails();
  await createUsersForOrphanApplications();

  const userCount = await User.countDocuments();
  const appCount = await Application.countDocuments();
  console.log(`\nDone. Users: ${userCount}, Applications: ${appCount}`);
  console.log('Re-run: node scripts/audit-users-applications.js');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
