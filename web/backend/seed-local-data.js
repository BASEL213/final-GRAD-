const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');

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
  },
  {
    name: 'Mansoura Gardens',
    location: 'Mansoura, City Center',
    totalUnits: 80,
    availableUnits: 60,
    priceRange: '600K - 1.2M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-08-31'),
    description: 'Affordable housing project in Mansoura'
  },
  {
    name: 'Suez Canal City Residences',
    location: 'Suez Canal City',
    totalUnits: 150,
    availableUnits: 100,
    priceRange: '700K - 1.4M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2026-03-31'),
    description: 'Modern residential complex near Suez Canal'
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
  },
  {
    name: 'Omar Abdel Rahman',
    email: 'omar.abdel@email.com',
    password: 'password123',
    phone: '01098765432',
    nationalId: '29812345678903',
    role: 'citizen',
    profile: {
      address: '78 El-Mansoura Street, Giza, Egypt',
      occupation: 'Accountant',
      familySize: 5,
      monthlyIncome: 18000
    }
  },
  {
    name: 'Mona Mahmoud Ali',
    email: 'mona.mahmoud@email.com',
    password: 'password123',
    phone: '01287654321',
    nationalId: '29212345678904',
    role: 'citizen',
    profile: {
      address: '56 El-Nasr Street, New Capital, Egypt',
      occupation: 'Doctor',
      familySize: 2,
      monthlyIncome: 35000
    }
  },
  {
    name: 'System Administrator',
    email: 'admin@housing.gov.eg',
    password: 'admin123',
    phone: '01000000000',
    nationalId: '29000000000000',
    role: 'admin',
    department: 'Administration',
    status: 'active',
    isVerified: true,
    profile: {
      address: 'Ministry of Housing, Cairo, Egypt',
      occupation: 'System Administrator',
      familySize: 1,
      monthlyIncome: 0
    }
  },
  {
    name: 'Nour Hassan El-Sayed',
    email: 'nour.hassan@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110001',
    nationalId: '29110000000001',
    role: 'employee',
    department: 'Housing Review',
    status: 'active',
    isVerified: true,
  },
  {
    name: 'Yasmin Farouk Abdel Nasser',
    email: 'yasmin.finance@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110002',
    nationalId: '29110000000002',
    role: 'employee',
    department: 'Finance',
    status: 'active',
    isVerified: true,
  },
  {
    name: 'Khaled Mahmoud Osman',
    email: 'khaled.support@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110003',
    nationalId: '29110000000003',
    role: 'employee',
    department: 'Support',
    status: 'active',
    isVerified: true,
  },
  {
    name: 'Heba Salah Ibrahim',
    email: 'heba.complaints@housing.gov.eg',
    password: 'Employee@123',
    phone: '01011110004',
    nationalId: '29110000000004',
    role: 'employee',
    department: 'Complaints',
    status: 'active',
    isVerified: true,
  },
];

async function seedLocalData() {
  try {
    console.log('🌱 Seeding Local MongoDB Database for Frontend Testing');
    console.log('=====================================================');

    // Connect to local MongoDB
    await mongoose.connect('mongodb://localhost:27017/housing_system');
    console.log('✅ Connected to Local MongoDB');

    // Create projects
    const existingProjects = await Project.countDocuments();
    if (existingProjects === 0) {
      const createdProjects = await Project.insertMany(sampleProjects);
      console.log(`✅ Created ${createdProjects.length} projects`);
      
      createdProjects.forEach(project => {
        console.log(`   📋 ${project.name}`);
      });
    } else {
      console.log(`✅ Projects already exist (${existingProjects})`);
    }

    // Create users
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      const createdUsers = await User.insertMany(sampleUsers);
      console.log(`✅ Created ${createdUsers.length} users`);
      
      createdUsers.forEach(user => {
        console.log(`   👤 ${user.name} (${user.role})`);
      });
    } else {
      console.log(`✅ Users already exist (${existingUsers})`);
    }

    console.log('\n🎉 Local database seeded successfully!');
    console.log('📊 Frontend can now test with real MongoDB data!');
    console.log('\n🌐 Ready for frontend testing:');
    console.log('   • Projects Page: Will show projects');
    console.log('   • Reports Page: Will show data');
    console.log('   • Applications: Will work with users');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedLocalData();
