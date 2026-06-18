const mongoose = require('mongoose');
const Project = require('./models/Project');

// Diverse sample projects with different Egyptian locations
const diverseProjects = [
  {
    name: 'Marsa Matrouh Tower',
    location: 'Marsa Matrouh, North Coast',
    totalUnits: 80,
    availableUnits: 65,
    priceRange: '2.5M - 4M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-08-31'),
    description: 'Luxury residential tower on the Mediterranean coast with beach access and modern amenities'
  },
  {
    name: 'El-Mansoura Business District',
    location: 'El-Mansoura, Downtown',
    totalUnits: 120,
    availableUnits: 95,
    priceRange: '1.8M - 3.5M EGP',
    type: 'Mixed',
    status: 'planning',
    completionDate: new Date('2026-03-31'),
    description: 'Mixed-use development combining residential and commercial spaces in prime city location'
  },
  {
    name: 'Kafr El-Sheikh Gardens',
    location: 'Kafr El-Sheikh, Delta Region',
    totalUnits: 200,
    availableUnits: 180,
    priceRange: '800K - 1.5M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-12-15'),
    description: 'Gated community with luxury villas surrounded by gardens and recreational facilities'
  },
  {
    name: 'Port Said Canal View',
    location: 'Port Said, Suez Canal Zone',
    totalUnits: 150,
    availableUnits: 110,
    priceRange: '1.2M - 2.8M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-10-30'),
    description: 'Modern apartment complex with panoramic views of the Suez Canal'
  },
  {
    name: 'Aswan Riverside Resort',
    location: 'Aswan, Nile Riverside',
    totalUnits: 90,
    availableUnits: 75,
    priceRange: '3M - 5M EGP',
    type: 'Mixed',
    status: 'planning',
    completionDate: new Date('2026-06-30'),
    description: 'Premium resort development along the Nile River with luxury apartments and villas'
  },
  {
    name: 'Suez Business Complex',
    location: 'Suez, Industrial Zone',
    totalUnits: 60,
    availableUnits: 45,
    priceRange: '950K - 1.8M EGP',
    type: 'Mixed',
    status: 'planning',
    completionDate: new Date('2026-04-15'),
    description: 'Mixed-use development combining office spaces and retail units in strategic industrial location'
  },
  {
    name: 'Luxor Heritage Village',
    location: 'Luxor, West Bank',
    totalUnits: 140,
    availableUnits: 120,
    priceRange: '600K - 1.2M EGP',
    type: 'Villas',
    status: 'active',
    completionDate: new Date('2025-09-30'),
    description: 'Traditional-style villas with modern amenities near ancient monuments'
  },
  {
    name: 'Hurghada Marina Complex',
    location: 'Hurghada, Red Sea Coast',
    totalUnits: 100,
    availableUnits: 85,
    priceRange: '1.5M - 3M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-11-30'),
    description: 'Beachfront apartments with direct marina access and water sports facilities'
  },
  {
    name: 'Faiyum Oasis Gardens',
    location: 'Faiyum, Oasis Road',
    totalUnits: 75,
    availableUnits: 60,
    priceRange: '700K - 1.4M EGP',
    type: 'Villas',
    status: 'planning',
    completionDate: new Date('2026-02-28'),
    description: 'Eco-friendly villa community surrounded by natural landscapes and farmland'
  },
  {
    name: 'Ismailia Tech Hub',
    location: 'Ismailia, Technology Park',
    totalUnits: 180,
    availableUnits: 150,
    priceRange: '1.1M - 2.2M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2025-07-31'),
    description: 'Modern mixed development integrating residential units with tech incubator spaces'
  }
];

async function insertDiverseProjects() {
  try {
    console.log('🌱 Inserting diverse sample projects into MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/housing_system');
    
    // Clear existing projects to start fresh
    await Project.deleteMany({});
    console.log('🗑️ Cleared existing projects');
    
    // Insert diverse projects
    const insertedProjects = await Project.insertMany(diverseProjects);
    
    console.log('✅ Successfully inserted diverse projects:');
    insertedProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} - ${project.location}`);
      console.log(`   Status: ${project.status}, Units: ${project.totalUnits}, Price: ${project.priceRange}`);
    });
    
    console.log(`\n📊 Total projects inserted: ${insertedProjects.length}`);
    console.log('📍 Locations covered:');
    const locations = [...new Set(diverseProjects.map(p => p.location.split(',')[0]))];
    locations.forEach(loc => console.log(`   - ${loc}`));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error inserting diverse projects:', error);
    process.exit(1);
  }
}

// Run insertion
insertDiverseProjects();
