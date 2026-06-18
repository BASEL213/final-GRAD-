const mongoose = require('mongoose');
const Project = require('./models/Project');

const mongoUri = process.env.MONGODB_URI || 'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

const BASE_URL = 'http://localhost:3000/uploads/projects';

const projects = [
  {
    name: 'Alexandria Coastal Towers',
    location: 'Alexandria',
    totalUnits: 180,
    availableUnits: 45,
    priceRange: '2M - 4M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-09-30'),
    description: 'Luxury coastal towers with panoramic sea views and premium amenities on the Mediterranean coast',
    imageUrl: `${BASE_URL}/ALEX.jpg`
  },
  {
    name: 'Aswan Riverside Resort',
    location: 'Aswan, Nile Riverside',
    totalUnits: 90,
    availableUnits: 60,
    priceRange: '3M - 5M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2026-06-30'),
    description: 'Premium resort-style development along the Nile River with luxury apartments and stunning river views',
    imageUrl: `${BASE_URL}/aswan.jpg`
  },
  {
    name: 'El Hosary Giza',
    location: 'El Hosary, 6th of October',
    totalUnits: 320,
    availableUnits: 120,
    priceRange: '1.2M - 2.8M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-12-31'),
    description: 'Modern residential compound in the heart of 6th of October with world-class facilities and green spaces',
    imageUrl: `${BASE_URL}/el hosary giza.png`
  },
  {
    name: 'Faiyum Oasis Gardens',
    location: 'Faiyum, Oasis Road',
    totalUnits: 75,
    availableUnits: 50,
    priceRange: '700K - 1.4M EGP',
    type: 'Villas',
    status: 'planning',
    completionDate: new Date('2026-02-28'),
    description: 'Eco-friendly villa community surrounded by natural oasis landscapes and tranquil farmland',
    imageUrl: `${BASE_URL}/fayoum.jpg`
  },
  {
    name: 'Giza Pyramid Heights',
    location: 'Giza',
    totalUnits: 200,
    availableUnits: 80,
    priceRange: '1.5M - 3.5M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2025-11-30'),
    description: 'Prestigious mixed development with breathtaking views of the iconic Giza pyramids',
    imageUrl: `${BASE_URL}/Giza_pyramids.png`
  },
  {
    name: 'IL Bosco New Capital',
    location: 'New Administrative Capital',
    totalUnits: 500,
    availableUnits: 210,
    priceRange: '2.5M - 6M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2026-03-31'),
    description: 'Flagship mixed-use development in the New Administrative Capital blending Italian design with Egyptian living',
    imageUrl: `${BASE_URL}/IL-Bosco-New-Capita.jpg`
  },
  {
    name: 'Mountain View New Cairo',
    location: 'New Cairo',
    totalUnits: 400,
    availableUnits: 135,
    priceRange: '2M - 5M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-10-31'),
    description: 'Award-winning gated community in New Cairo offering spacious villas with landscaped parks and sports facilities',
    imageUrl: `${BASE_URL}/mountain view newcairo .png`
  },
  {
    name: 'New Giza Compound',
    location: 'New Giza, 6th of October',
    totalUnits: 600,
    availableUnits: 90,
    priceRange: '3M - 8M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2025-07-31'),
    description: 'Upscale integrated community offering villas, townhouses, and apartments in a lush green setting',
    imageUrl: `${BASE_URL}/New-Giza.jpg`
  },
  {
    name: 'New Giza Premium Villas',
    location: 'New Giza, 6th of October',
    totalUnits: 150,
    availableUnits: 35,
    priceRange: '5M - 12M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-08-31'),
    description: 'Exclusive collection of standalone villas within New Giza featuring private gardens and pools',
    imageUrl: `${BASE_URL}/New-Giza-2.jpg`
  },
  {
    name: 'New Capital Residences',
    location: 'New Administrative Capital',
    totalUnits: 350,
    availableUnits: 180,
    priceRange: '1.8M - 4M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2026-01-31'),
    description: "Smart residential towers in Egypt's New Administrative Capital with integrated smart-home technology",
    imageUrl: `${BASE_URL}/newCapital.jpg`
  },
  {
    name: 'Marsa Matrouh Towers',
    location: 'Marsa Matrouh, North Coast',
    totalUnits: 120,
    availableUnits: 75,
    priceRange: '1.5M - 3M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-08-31'),
    description: 'Elegant beachfront towers with direct Mediterranean beach access and resort-style amenities',
    imageUrl: `${BASE_URL}/north coast.jpg`
  },
  {
    name: 'Sahel Blue Lagoon',
    location: 'North Coast, Sahel',
    totalUnits: 200,
    availableUnits: 110,
    priceRange: '2M - 4.5M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-06-30'),
    description: 'Summer resort community on the North Coast with private lagoon, beach club, and luxury chalets',
    imageUrl: `${BASE_URL}/north coast 2.jpg`
  },
  {
    name: 'Port Said Canal View',
    location: 'Port Said, Suez Canal Zone',
    totalUnits: 150,
    availableUnits: 95,
    priceRange: '1.2M - 2.8M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-10-30'),
    description: 'Modern apartment complex with panoramic views of the Suez Canal and easy access to port facilities',
    imageUrl: `${BASE_URL}/portsaid.jpg`
  },
  {
    name: 'Sun Capital 6th October',
    location: '6th of October, Giza',
    totalUnits: 280,
    availableUnits: 140,
    priceRange: '1.5M - 3.5M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2025-12-31'),
    description: 'Vibrant mixed-use community in 6th of October offering apartments, twin houses and a commercial hub',
    imageUrl: `${BASE_URL}/sun-capital-6-october_Giza.jpeg`
  },
  {
    name: 'Uptown Cairo Villas',
    location: 'New Cairo',
    totalUnits: 250,
    availableUnits: 60,
    priceRange: '4M - 9M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-09-30'),
    description: 'Premium villa community in New Cairo inspired by global architectural standards with panoramic Cairo views',
    imageUrl: `${BASE_URL}/Uptown-Cairo-Z5-Villas-New-Cairo-1.jpg`
  }
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Drop stale slug index if present (not in our schema)
    try {
      await mongoose.connection.collection('projects').dropIndex('slug_1');
      console.log('Dropped stale slug_1 index');
    } catch (_) { /* index didn't exist, ignore */ }

    await Project.deleteMany({});
    console.log('Cleared existing projects');

    const inserted = await Project.insertMany(projects);
    console.log(`\nSeeded ${inserted.length} projects:\n`);
    inserted.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} — ${p.location}`);
      console.log(`   Image: ${p.imageUrl}`);
    });

    await mongoose.disconnect();
    console.log('\nDone. Disconnected from MongoDB.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
