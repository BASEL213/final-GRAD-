const mongoose = require('mongoose');
const Application = require('./models/Application');

// Get existing projects from MongoDB to link applications
const getExistingProjects = async () => {
  const projects = await mongoose.connection.db.collection('projects').find({}).toArray();
  return projects;
};

// Diverse sample applications with complete structure
const diverseApplications = [
  {
    name: 'Mohamed Ali Hassan',
    nationalId: '28012345678901',
    email: 'mohamed.hassan@email.com',
    phone: '01012345678',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 18000,
    familySize: 3,
    currentHousing: 'Renting apartment in Dokki',
    status: 'pending',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Fatima Mahmoud Omar',
    nationalId: '29502345678901',
    email: 'fatima.omar@email.com',
    phone: '01123456789',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 35000,
    familySize: 5,
    currentHousing: 'Living with parents in Heliopolis',
    status: 'pending',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Ahmed Kamal Mohamed',
    nationalId: '27502345678901',
    email: 'ahmed.kamal@email.com',
    phone: '01234567891',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 22000,
    familySize: 4,
    currentHousing: 'Owned apartment in Maadi',
    status: 'approved',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Sara Mahmoud Ali',
    nationalId: '29802345678901',
    email: 'sara.ali@email.com',
    phone: '01098765432',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 28000,
    familySize: 2,
    currentHousing: 'Renting studio in Zamalek',
    status: 'pending',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Omar Hassan Ibrahim',
    nationalId: '27002345678901',
    email: 'omar.ibrahim@email.com',
    phone: '01187654321',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 45000,
    familySize: 6,
    currentHousing: 'Renting villa in New Cairo',
    status: 'rejected',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Nadia Mohamed Said',
    nationalId: '29202345678901',
    email: 'nadia.said@email.com',
    phone: '01256789012',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 15000,
    familySize: 3,
    currentHousing: 'Living with family in Shubra',
    status: 'pending',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Karim Ahmed Soliman',
    nationalId: '28502345678901',
    email: 'karim.soliman@email.com',
    phone: '01034567890',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 32000,
    familySize: 4,
    currentHousing: 'Owned apartment in 6th of October',
    status: 'approved',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Mariam Mahmoud Reda',
    nationalId: '29602345678901',
    email: 'mariam.reda@email.com',
    phone: '01123456780',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 20000,
    familySize: 2,
    currentHousing: 'Renting apartment in Garden City',
    status: 'pending',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Youssef Ali Hassan',
    nationalId: '27302345678901',
    email: 'youssef.hassan@email.com',
    phone: '01287654321',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 38000,
    familySize: 5,
    currentHousing: 'Owned villa in Sheikh Zayed',
    status: 'approved',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  },
  {
    name: 'Laila Mohamed Kamel',
    nationalId: '29402345678901',
    email: 'laila.kamel@email.com',
    phone: '01065432109',
    projectId: null, // Will be set dynamically
    projectName: null, // Will be set dynamically
    income: 25000,
    familySize: 3,
    currentHousing: 'Renting apartment in Mohandeseen',
    status: 'pending',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  }
];

async function insertDiverseApplications() {
  try {
    console.log('🌱 Inserting diverse sample applications into MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/housing_system');
    
    // Get existing projects to link with applications
    const projects = await getExistingProjects();
    console.log(`📍 Found ${projects.length} projects to link with applications`);
    
    // Clear existing applications to start fresh
    await Application.deleteMany({});
    console.log('🗑️ Cleared existing applications');
    
    // Link applications to projects and prepare for insertion
    const applicationsWithProjects = diverseApplications.map((app, index) => {
      const project = projects[index % projects.length]; // Cycle through projects
      return {
        ...app,
        projectId: project._id,
        projectName: project.name
      };
    });
    
    // Insert diverse applications
    const insertedApplications = await Application.insertMany(applicationsWithProjects);
    
    console.log('✅ Successfully inserted diverse applications:');
    insertedApplications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.name} - ${app.projectName}`);
      console.log(`   Status: ${app.status}, Income: ${app.income} EGP, Family: ${app.familySize} members`);
    });
    
    console.log(`\n📊 Total applications inserted: ${insertedApplications.length}`);
    console.log('📈 Application status distribution:');
    const statusCounts = {};
    insertedApplications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} applications`);
    });
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error inserting diverse applications:', error);
    process.exit(1);
  }
}

// Run insertion
insertDiverseApplications();
