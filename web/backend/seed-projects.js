const mongoose = require('mongoose');
const Project = require('./models/Project');

// MongoDB connection
const mongoUri = 'mongodb+srv://Gov_admin:password%40123@findoorcluster0.gzhcjts.mongodb.net/gov_system';

const seedProjects = async () => {
    try {
        // Clear existing projects
        await Project.deleteMany({});
        console.log('🗑️ Cleared existing projects');

        // Sample projects
        const projects = [
            {
                name: "Cairo Garden Residences",
                location: "New Cairo City",
                totalUnits: 250,
                availableUnits: 45,
                priceRange: "1.5M - 3.5M EGP",
                type: "Apartments",
                status: "active",
                completionDate: new Date("2024-12-31"),
                description: "Modern residential complex with green spaces and amenities"
            },
            {
                name: "Alexandria Coastal Towers",
                location: "Alexandria",
                totalUnits: 180,
                availableUnits: 23,
                priceRange: "2M - 4M EGP",
                type: "Villas",
                status: "active",
                completionDate: new Date("2025-06-30"),
                description: "Luxury coastal villas with sea views"
            },
            {
                name: "Giza Pyramid Heights",
                location: "Giza",
                totalUnits: 320,
                availableUnits: 67,
                priceRange: "1M - 2.5M EGP",
                type: "Mixed",
                status: "planning",
                completionDate: new Date("2025-12-15"),
                description: "Mixed development with apartments and villas near pyramids"
            },
            {
                name: "Nile Riverside Complex",
                location: "Cairo",
                totalUnits: 150,
                availableUnits: 12,
                priceRange: "3M - 5M EGP",
                type: "Apartments",
                status: "active",
                completionDate: new Date("2024-08-15"),
                description: "Premium apartments with Nile river views"
            },
            {
                name: "Sahara Desert Oasis",
                location: "New Cairo City",
                totalUnits: 200,
                availableUnits: 180,
                priceRange: "800K - 1.5M EGP",
                type: "Villas",
                status: "completed",
                completionDate: new Date("2024-03-01"),
                description: "Affordable villa community in desert oasis setting"
            }
        ];

        // Insert projects
        await Project.insertMany(projects);
        console.log('✅ Sample projects seeded successfully');
        console.log(`📊 Seeded ${projects.length} projects`);

    } catch (error) {
        console.error('❌ Error seeding projects:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
};

// Connect and seed
mongoose.connect(mongoUri)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        seedProjects();
    })
    .catch(err => {
        console.error('❌ Connection error:', err);
    });
