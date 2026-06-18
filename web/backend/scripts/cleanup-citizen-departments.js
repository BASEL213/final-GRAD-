/**
 * Remove department from all citizen accounts in MongoDB.
 * Run: node scripts/cleanup-citizen-departments.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

async function main() {
  await mongoose.connect(mongoUri);
  const result = await User.updateMany(
    { role: 'citizen' },
    { $unset: { department: '' } }
  );
  console.log(`Cleared department on ${result.modifiedCount} citizen account(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
