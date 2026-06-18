const mongoose = require('mongoose');

// Test MongoDB connection
const mongoUri = 'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

async function testConnection() {
    try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('🔍 Connection URI:', mongoUri);
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        });
        
        console.log('✅ Connected to MongoDB successfully');
        console.log('📊 Database name:', mongoose.connection.name);
        
        // List all databases
        const admin = mongoose.connection.db.admin();
        const databases = await admin.listDatabases();
        console.log('📋 Available databases:');
        databases.databases.forEach(db => {
            console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
        });
        
        // Check collections in current database
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('📁 Collections in current database:');
        collections.forEach(collection => {
            console.log(`  - ${collection.name}`);
        });
        
        // Count documents in each collection
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`  📄 ${collection.name}: ${count} documents`);
        }
        
        await mongoose.disconnect();
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
