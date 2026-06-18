/**
 * One-off script: remove applications not linked to a MongoDB project.
 * Run: node scripts/cleanup-orphan-applications.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { cleanupOrphanApplications } = require('../controllers/applicationController');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

async function main() {
  await mongoose.connect(mongoUri);
  const { deletedCount } = await cleanupOrphanApplications();
  console.log(`Done. Deleted ${deletedCount} orphan application(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
