const mongoose = require('mongoose');
const Project = require('./backend/models/Project');
const User = require('./backend/models/User');
const Application = require('./backend/models/Application');

// Sample data for frontend testing
const sampleProjects = [
  {
    name: 'Cairo Garden Residences',
    location: 'New Cairo, 90th Street',
    totalUnits: 200,
    availableUnits: 150,
    priceRange: '1.5M - 3M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-12-31'),
    description: 'Luxury residential complex in New Cairo with modern amenities'
  },
  {
    name: 'Alexandria Coastal Towers',
    location: 'Alexandria, Corniche Road',
    totalUnits: 120,
    availableUnits: 80,
    priceRange: '800K - 1.5M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-09-30'),
    description: 'Sea-view apartments with premium facilities'
  },
  {
    name: 'New Capital City Complex',
    location: 'New Administrative Capital',
    totalUnits: 300,
    availableUnits: 200,
    priceRange: '2M - 4M EGP',
    type: 'Mixed',
    status: 'active',
    completionDate: new Date('2026-06-30'),
    description: 'Mixed-use development in the heart of New Capital'
  }
];

const sampleUsers = [
  {
    name: 'Ahmed Mohamed Hassan',
    email: 'ahmed.hassan@email.com',
    password: 'password123',
    phone: '01234567890',
    nationalId: '29012345678901',
    role: 'citizen',
    profile: {
      address: '123 El-Tahrir Street, Cairo, Egypt',
      occupation: 'Software Engineer',
      familySize: 4,
      monthlyIncome: 25000
    }
  },
  {
    name: 'Fatma Ali Khalil',
    email: 'fatma.khalil@email.com',
    password: 'password123',
    phone: '01123456789',
    nationalId: '29512345678902',
    role: 'citizen',
    profile: {
      address: '45 Gamea Street, Alexandria, Egypt',
      occupation: 'Teacher',
      familySize: 3,
      monthlyIncome: 12000
    }
  }
];

const sampleApplications = [
  {
    name: 'Omar Abdel Rahman',
    nationalId: '29812345678903',
    email: 'omar.abdel@email.com',
    phone: '01098765432',
    projectId: null, // Will be set after creating projects
    projectName: 'Cairo Garden Residences',
    income: 18000,
    familySize: 5,
    currentHousing: 'Currently living in rented apartment'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding MongoDB Database for Frontend Testing');
    console.log('================================================');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/housing_system');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Project.deleteMany({});
    await User.deleteMany({});
    await Application.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create projects
    const createdProjects = await Project.insertMany(sampleProjects);
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Create users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create applications with project references
    sampleApplications[0].projectId = createdProjects[0]._id;
    const createdApplications = await Application.insertMany(sampleApplications);
    console.log(`✅ Created ${createdApplications.length} applications`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   • Projects: ${createdProjects.length}`);
    console.log(`   • Users: ${createdUsers.length}`);
    console.log(`   • Applications: ${createdApplications.length}`);
    console.log('\n🌐 Frontend can now test with real MongoDB data!');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
