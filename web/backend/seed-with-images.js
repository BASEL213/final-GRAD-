require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');

const mongoUri = process.env.MONGODB_URI || 'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

// Use actual server IP so images work on both web and mobile.
// Override with: SERVER_IP=x.x.x.x node seed-with-images.js
const SERVER_IP = process.env.SERVER_IP || '192.168.1.8';
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://${SERVER_IP}:${PORT}/uploads/projects`;

// Encode spaces/special chars so image URLs are valid HTTP URLs
const img = (filename) => `${BASE_URL}/${encodeURIComponent(filename)}`;

const projects = [
  {
    name: 'Alexandria Coastal Towers',
    location: 'Alexandria',
    totalUnits: 180, availableUnits: 45,
    priceRange: '2M - 4M EGP', type: 'Villas', status: 'active',
    completionDate: new Date('2025-09-30'),
    description: 'Luxury coastal towers with panoramic sea views and premium amenities on the Mediterranean coast',
    imageUrl: img('ALEX.jpg'),
    images: [img('ALEX.jpg'), img('ALEX 2jpg.jpg'), img('ALEX 3.jpg')],
    propertyTypes: [
      { category: 'Villas', units: ['Twin House (200–250 m²)', 'Townhouse (260–310 m²)', 'Standalone Villa (350–500 m²)'] }
    ]
  },
  {
    name: 'Aswan Riverside Resort',
    location: 'Aswan, Nile Riverside',
    totalUnits: 90, availableUnits: 60,
    priceRange: '3M - 5M EGP', type: 'Mixed', status: 'active',
    completionDate: new Date('2026-06-30'),
    description: 'Premium resort-style development along the Nile River with luxury apartments and stunning river views',
    imageUrl: img('aswan.jpg'),
    images: [img('aswan.jpg')],
    propertyTypes: [
      { category: 'Apartments', units: ['1-Bedroom (80–100 m²)', '2-Bedroom (110–140 m²)', '3-Bedroom (150–180 m²)'] },
      { category: 'Villas',     units: ['Chalet (100–140 m²)', 'Twin House (190–230 m²)'] }
    ]
  },
  {
    name: 'El Hosary Giza',
    location: 'El Hosary, 6th of October',
    totalUnits: 320, availableUnits: 120,
    priceRange: '1.2M - 2.8M EGP', type: 'Apartments', status: 'active',
    completionDate: new Date('2025-12-31'),
    description: 'Modern residential compound in the heart of 6th of October with world-class facilities and green spaces',
    imageUrl: img('el hosary giza.png'),
    images: [img('el hosary giza.png')],
    propertyTypes: [
      { category: 'Apartments', units: ['Studio (50–65 m²)', '1-Bedroom (80–95 m²)', '2-Bedroom (110–130 m²)', '3-Bedroom (145–170 m²)'] }
    ]
  },
  {
    name: 'Faiyum Oasis Gardens',
    location: 'Faiyum, Oasis Road',
    totalUnits: 75, availableUnits: 50,
    priceRange: '700K - 1.4M EGP', type: 'Villas', status: 'planning',
    completionDate: new Date('2026-02-28'),
    description: 'Eco-friendly villa community surrounded by natural oasis landscapes and tranquil farmland',
    imageUrl: img('fayoum.jpg'),
    images: [img('fayoum.jpg')],
    propertyTypes: [
      { category: 'Villas', units: ['Townhouse (200–240 m²)', 'Standalone Villa (280–380 m²)'] }
    ]
  },
  {
    name: 'Giza Pyramid Heights',
    location: 'Giza',
    totalUnits: 200, availableUnits: 80,
    priceRange: '1.5M - 3.5M EGP', type: 'Mixed', status: 'active',
    completionDate: new Date('2025-11-30'),
    description: 'Prestigious mixed development with breathtaking views of the iconic Giza pyramids',
    imageUrl: img('Giza_pyramids.png'),
    images: [img('Giza_pyramids.png'), img('Giza_pyramids 2.png')],
    propertyTypes: [
      { category: 'Apartments', units: ['1-Bedroom (85–100 m²)', '2-Bedroom (115–135 m²)', '3-Bedroom (155–175 m²)'] },
      { category: 'Villas',     units: ['Twin House (210–260 m²)', 'Standalone Villa (320–450 m²)'] }
    ]
  },
  {
    name: 'IL Bosco New Capital',
    location: 'New Administrative Capital',
    totalUnits: 500, availableUnits: 210,
    priceRange: '2.5M - 6M EGP', type: 'Mixed', status: 'active',
    completionDate: new Date('2026-03-31'),
    description: 'Flagship mixed-use development in the New Administrative Capital blending Italian design with Egyptian living',
    imageUrl: img('IL-Bosco-New-Capita.jpg'),
    images: [img('IL-Bosco-New-Capita.jpg'), img('IL BOSCO 3.png'), img('IL BOSCO 4.png')],
    propertyTypes: [
      { category: 'Apartments', units: ['1-Bedroom (90–110 m²)', '2-Bedroom (120–145 m²)', '3-Bedroom (160–185 m²)', '4-Bedroom (200–230 m²)'] },
      { category: 'Villas',     units: ['Townhouse (260–310 m²)', 'Standalone Villa (370–520 m²)', 'Duplex Villa (300–390 m²)'] }
    ]
  },
  {
    name: 'Mountain View New Cairo',
    location: 'New Cairo',
    totalUnits: 400, availableUnits: 135,
    priceRange: '2M - 5M EGP', type: 'Villas', status: 'active',
    completionDate: new Date('2025-10-31'),
    description: 'Award-winning gated community in New Cairo offering spacious villas with landscaped parks and sports facilities',
    imageUrl: img('mountain view newcairo .png'),
    images: [img('mountain view newcairo .png'), img('MOUNTAIN VIEW NEW CAIRO.png'), img('MOUNTAIN VIEW NEW CAIRO 2.png')],
    propertyTypes: [
      { category: 'Villas', units: ['Twin House (220–270 m²)', 'Townhouse (260–320 m²)', 'Standalone Villa (360–560 m²)'] }
    ]
  },
  {
    name: 'New Giza Compound',
    location: 'New Giza, 6th of October',
    totalUnits: 600, availableUnits: 90,
    priceRange: '3M - 8M EGP', type: 'Mixed', status: 'active',
    completionDate: new Date('2025-07-31'),
    description: 'Upscale integrated community offering villas, townhouses, and apartments in a lush green setting',
    imageUrl: img('New-Giza.jpg'),
    images: [img('New-Giza.jpg'), img('New-Giza-2.jpg')],
    propertyTypes: [
      { category: 'Apartments', units: ['1-Bedroom (90–110 m²)', '2-Bedroom (125–150 m²)', '3-Bedroom (165–195 m²)'] },
      { category: 'Villas',     units: ['Townhouse (270–330 m²)', 'Standalone Villa (390–620 m²)'] }
    ]
  },
  {
    name: 'New Giza Premium Villas',
    location: 'New Giza, 6th of October',
    totalUnits: 150, availableUnits: 35,
    priceRange: '5M - 12M EGP', type: 'Villas', status: 'active',
    completionDate: new Date('2025-08-31'),
    description: 'Exclusive collection of standalone villas within New Giza featuring private gardens and pools',
    imageUrl: img('New-Giza-2.jpg'),
    images: [img('New-Giza-2.jpg'), img('New-Giza.jpg')],
    propertyTypes: [
      { category: 'Villas', units: ['Twin House (260–310 m²)', 'Standalone Villa (420–720 m²)', 'Duplex Villa (360–460 m²)'] }
    ]
  },
  {
    name: 'New Capital Residences',
    location: 'New Administrative Capital',
    totalUnits: 350, availableUnits: 180,
    priceRange: '1.8M - 4M EGP', type: 'Apartments', status: 'active',
    completionDate: new Date('2026-01-31'),
    description: "Smart residential towers in Egypt's New Administrative Capital with integrated smart-home technology",
    imageUrl: img('newCapital.jpg'),
    images: [img('newCapital.jpg'), img('newCapital 1.jpg')],
    propertyTypes: [
      { category: 'Apartments', units: ['Studio (55–70 m²)', '1-Bedroom (85–105 m²)', '2-Bedroom (115–140 m²)', '3-Bedroom (155–185 m²)'] }
    ]
  },
  {
    name: 'Sahel Blue Lagoon',
    location: 'North Coast, Sahel',
    totalUnits: 200, availableUnits: 110,
    priceRange: '2M - 4.5M EGP', type: 'Villas', status: 'active',
    completionDate: new Date('2025-06-30'),
    description: 'Summer resort community on the North Coast with private lagoon, beach club, and luxury chalets',
    imageUrl: img('north coast 2.jpg'),
    images: [img('north coast 2.jpg'), img('north coast.jpg')],
    propertyTypes: [
      { category: 'Villas', units: ['Chalet (90–130 m²)', 'Twin House (180–220 m²)', 'Standalone Villa (260–370 m²)'] }
    ]
  },
  {
    name: 'Port Said Canal View',
    location: 'Port Said, Suez Canal Zone',
    totalUnits: 150, availableUnits: 95,
    priceRange: '1.2M - 2.8M EGP', type: 'Apartments', status: 'active',
    completionDate: new Date('2025-10-30'),
    description: 'Modern apartment complex with panoramic views of the Suez Canal and easy access to port facilities',
    imageUrl: img('portsaid.jpg'),
    images: [img('portsaid.jpg')],
    propertyTypes: [
      { category: 'Apartments', units: ['Studio (50–65 m²)', '1-Bedroom (80–100 m²)', '2-Bedroom (110–135 m²)'] }
    ]
  },
  {
    name: 'Sun Capital 6th October',
    location: '6th of October, Giza',
    totalUnits: 280, availableUnits: 140,
    priceRange: '1.5M - 3.5M EGP', type: 'Mixed', status: 'active',
    completionDate: new Date('2025-12-31'),
    description: 'Vibrant mixed-use community in 6th of October offering apartments, twin houses and a commercial hub',
    imageUrl: img('sun-capital-6-october_Giza.jpeg'),
    images: [img('sun-capital-6-october_Giza.jpeg'), img('sun-capital-6-october_Giza 2.jpeg.png'), img('sun-capital-6-october_Giza 3.png')],
    propertyTypes: [
      { category: 'Apartments', units: ['1-Bedroom (85–105 m²)', '2-Bedroom (115–140 m²)', '3-Bedroom (150–178 m²)'] },
      { category: 'Villas',     units: ['Twin House (200–245 m²)', 'Townhouse (250–295 m²)'] }
    ]
  },
  {
    name: 'Uptown Cairo Villas',
    location: 'New Cairo',
    totalUnits: 250, availableUnits: 60,
    priceRange: '4M - 9M EGP', type: 'Villas', status: 'active',
    completionDate: new Date('2025-09-30'),
    description: 'Premium villa community in New Cairo inspired by global architectural standards with panoramic Cairo views',
    imageUrl: img('Uptown-Cairo-Z5-Villas-New-Cairo-1.jpg'),
    images: [img('Uptown-Cairo-Z5-Villas-New-Cairo-1.jpg')],
    propertyTypes: [
      { category: 'Villas', units: ['Standalone Villa (410–660 m²)', 'Duplex Villa (330–430 m²)'] }
    ]
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
