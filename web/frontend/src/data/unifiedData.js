// Unified Data Structure for Housing Management System
// Clean, production-ready mock data with proper relationships

export const UNIFIED_USERS = [
  {
    id: "user_001",
    name: "Ahmed Mohamed Hassan",
    email: "ahmed.hassan@email.com",
    phone: "01234567890",
    nationalId: "29012345678901",
    role: "citizen",
    isVerified: true,
    createdAt: "2024-01-15T08:30:00Z",
    profile: {
      address: "123 El-Tahrir Street, Cairo, Egypt",
      occupation: "Software Engineer",
      familySize: 4,
      monthlyIncome: 25000
    }
  },
  {
    id: "user_002", 
    name: "Fatma Ali Khalil",
    email: "fatma.khalil@email.com",
    phone: "01123456789",
    nationalId: "29512345678902",
    role: "citizen",
    isVerified: true,
    createdAt: "2024-02-10T10:15:00Z",
    profile: {
      address: "45 Gamea Street, Alexandria, Egypt",
      occupation: "Teacher",
      familySize: 3,
      monthlyIncome: 12000
    }
  },
  {
    id: "user_003",
    name: "Omar Abdel Rahman",
    email: "omar.abdel@email.com", 
    phone: "01098765432",
    nationalId: "29812345678903",
    role: "citizen",
    isVerified: true,
    createdAt: "2024-01-20T14:20:00Z",
    profile: {
      address: "78 El-Mansoura Street, Giza, Egypt",
      occupation: "Accountant",
      familySize: 5,
      monthlyIncome: 18000
    }
  },
  {
    id: "user_004",
    name: "Mona Mahmoud Ali",
    email: "mona.mahmoud@email.com",
    phone: "01287654321", 
    nationalId: "29212345678904",
    role: "citizen",
    isVerified: true,
    createdAt: "2024-03-05T09:45:00Z",
    profile: {
      address: "56 El-Nasr Street, New Capital, Egypt",
      occupation: "Doctor",
      familySize: 2,
      monthlyIncome: 35000
    }
  },
  {
    id: "user_005",
    name: "System Administrator",
    email: "admin@housing.gov.eg",
    phone: "01000000000",
    nationalId: "29000000000000",
    role: "admin",
    isVerified: true,
    createdAt: "2024-01-01T00:00:00Z",
    profile: {
      address: "Ministry of Housing, Cairo, Egypt",
      occupation: "System Administrator",
      familySize: 1,
      monthlyIncome: 0
    }
  }
];

export const UNIFIED_PROJECTS = [
  {
    id: "proj_001",
    name: "Cairo Garden Residences",
    location: {
      city: "Cairo",
      district: "New Cairo",
      address: "90th Street, Fifth Settlement"
    },
    type: "residential",
    category: "apartments",
    status: "active",
    development: {
      totalUnits: 450,
      availableUnits: 120,
      soldUnits: 330,
      phases: 3
    },
    pricing: {
      priceRange: "2.5M - 4.5M EGP",
      unitTypes: ["2BR", "3BR", "4BR"],
      downPayment: "10%",
      installmentYears: 8
    },
    timeline: {
      completionDate: "2024-12-31",
      deliveryDate: "2025-03-31",
      constructionProgress: 85
    },
    features: {
      amenities: ["Swimming Pool", "Gym", "Security", "Parking", "Kids Area"],
      areaRange: "120 - 240 sqm",
      floors: 12
    },
    description: "Modern residential complex in New Cairo with premium amenities and strategic location"
  },
  {
    id: "proj_002",
    name: "Alexandria Coastal Towers",
    location: {
      city: "Alexandria",
      district: "Sidi Gaber",
      address: "Corniche Road, Mediterranean Coast"
    },
    type: "residential",
    category: "luxury_apartments",
    status: "active",
    development: {
      totalUnits: 280,
      availableUnits: 45,
      soldUnits: 235,
      phases: 2
    },
    pricing: {
      priceRange: "3.8M - 7.2M EGP",
      unitTypes: ["3BR", "4BR", "Penthouse"],
      downPayment: "15%",
      installmentYears: 10
    },
    timeline: {
      completionDate: "2025-06-30",
      deliveryDate: "2025-09-30",
      constructionProgress: 60
    },
    features: {
      amenities: ["Sea View", "Private Beach", "Spa", "Concierge", "Underground Parking"],
      areaRange: "180 - 350 sqm",
      floors: 25
    },
    description: "Luxury coastal towers with Mediterranean sea views and premium beach access"
  },
  {
    id: "proj_003",
    name: "New Capital City Complex",
    location: {
      city: "New Capital",
      district: "Downtown",
      address: "Central Business District"
    },
    type: "mixed_use",
    category: "residential_commercial",
    status: "planning",
    development: {
      totalUnits: 1200,
      availableUnits: 1200,
      soldUnits: 0,
      phases: 4
    },
    pricing: {
      priceRange: "1.8M - 5.5M EGP",
      unitTypes: ["Studio", "1BR", "2BR", "3BR", "Office"],
      downPayment: "5%",
      installmentYears: 12
    },
    timeline: {
      completionDate: "2026-12-31",
      deliveryDate: "2027-03-31",
      constructionProgress: 15
    },
    features: {
      amenities: ["Smart City", "Metro Access", "Central Park", "Shopping Mall", "Business Center"],
      areaRange: "65 - 300 sqm",
      floors: 35
    },
    description: "Mixed-use development in Egypt's new administrative capital with smart city features"
  },
  {
    id: "proj_004",
    name: "Mansoura Gardens",
    location: {
      city: "Mansoura",
      district: "El-Gomhoria",
      address: "Gamal Abdel Nasser Street"
    },
    type: "residential",
    category: "villas_townhouses",
    status: "active",
    development: {
      totalUnits: 180,
      availableUnits: 35,
      soldUnits: 145,
      phases: 2
    },
    pricing: {
      priceRange: "2.2M - 3.8M EGP",
      unitTypes: ["Townhouse", "Twin House", "Villa"],
      downPayment: "20%",
      installmentYears: 7
    },
    timeline: {
      completionDate: "2024-09-30",
      deliveryDate: "2024-11-30",
      constructionProgress: 95
    },
    features: {
      amenities: ["Private Garden", "Community Center", "Sports Club", "24/7 Security"],
      areaRange: "200 - 400 sqm",
      floors: 3
    },
    description: "Family-oriented residential community with private gardens and community facilities"
  },
  {
    id: "proj_005",
    name: "Suez Canal City Residences",
    location: {
      city: "Ismailia",
      district: "Suez Canal Zone",
      address: "Suez Canal Road"
    },
    type: "residential",
    category: "affordable_housing",
    status: "active",
    development: {
      totalUnits: 600,
      availableUnits: 280,
      soldUnits: 320,
      phases: 3
    },
    pricing: {
      priceRange: "850K - 1.5M EGP",
      unitTypes: ["1BR", "2BR", "3BR"],
      downPayment: "25%",
      installmentYears: 15
    },
    timeline: {
      completionDate: "2025-08-31",
      deliveryDate: "2025-10-31",
      constructionProgress: 40
    },
    features: {
      amenities: ["Public Transport", "Schools", "Healthcare", "Shopping Center"],
      areaRange: "75 - 150 sqm",
      floors: 8
    },
    description: "Affordable housing project near Suez Canal with government subsidies and easy payment plans"
  }
];

export const UNIFIED_APPLICATIONS = [
  {
    id: "app_001",
    userId: "user_001",
    projectId: "proj_001",
    status: "approved",
    priority: "normal",
    submittedAt: "2024-01-20T09:15:00Z",
    reviewedAt: "2024-01-22T14:30:00Z",
    reviewedBy: "user_005",
    applicationData: {
      requestedUnitType: "3BR",
      preferredFloor: "5-8",
      paymentMethod: "installments",
      specialRequirements: "Ground floor access for elderly parents"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded", 
      birthCertificate: "uploaded",
      marriageCertificate: "uploaded",
      bankStatements: "uploaded"
    },
    reviewNotes: "Applicant meets all criteria. Income sufficient for requested unit type.",
    rejectionReason: null
  },
  {
    id: "app_002",
    userId: "user_002",
    projectId: "proj_002",
    status: "pending",
    priority: "high",
    submittedAt: "2024-02-15T11:20:00Z",
    reviewedAt: null,
    reviewedBy: null,
    applicationData: {
      requestedUnitType: "4BR",
      preferredFloor: "15-20",
      paymentMethod: "cash",
      specialRequirements: "Sea view preferred"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded",
      bankStatements: "pending"
    },
    reviewNotes: null,
    rejectionReason: null
  },
  {
    id: "app_003",
    userId: "user_003",
    projectId: "proj_004",
    status: "rejected",
    priority: "normal",
    submittedAt: "2024-01-25T16:45:00Z",
    reviewedAt: "2024-01-28T10:00:00Z",
    reviewedBy: "user_005",
    applicationData: {
      requestedUnitType: "Villa",
      preferredFloor: "Ground Floor",
      paymentMethod: "installments",
      specialRequirements: "Large garden for children"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded",
      marriageCertificate: "uploaded"
    },
    reviewNotes: "Income below minimum requirement for villa category.",
    rejectionReason: "Monthly income of 18,000 EGP is below the 25,000 EGP minimum for villa units"
  },
  {
    id: "app_004",
    userId: "user_004",
    projectId: "proj_003",
    status: "pending",
    priority: "normal",
    submittedAt: "2024-03-10T13:30:00Z",
    reviewedAt: null,
    reviewedBy: null,
    applicationData: {
      requestedUnitType: "2BR",
      preferredFloor: "Any",
      paymentMethod: "installments",
      specialRequirements: "Metro access preferred"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded",
      professionalLicense: "uploaded"
    },
    reviewNotes: null,
    rejectionReason: null
  },
  {
    id: "app_005",
    userId: "user_001",
    projectId: "proj_005",
    status: "approved",
    priority: "low",
    submittedAt: "2024-02-05T08:00:00Z",
    reviewedAt: "2024-02-07T15:20:00Z",
    reviewedBy: "user_005",
    applicationData: {
      requestedUnitType: "2BR",
      preferredFloor: "3-5",
      paymentMethod: "installments",
      specialRequirements: "Close to schools"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded"
    },
    reviewNotes: "Eligible for affordable housing program. All documents verified.",
    rejectionReason: null
  },
  {
    id: "app_006",
    userId: "user_002",
    projectId: "proj_001",
    status: "rejected",
    priority: "normal",
    submittedAt: "2024-02-20T14:15:00Z",
    reviewedAt: "2024-02-22T11:45:00Z",
    reviewedBy: "user_005",
    applicationData: {
      requestedUnitType: "4BR",
      preferredFloor: "10-12",
      paymentMethod: "installments",
      specialRequirements: "Parking for 2 cars"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded",
      marriageCertificate: "uploaded"
    },
    reviewNotes: "Insufficient income for requested unit size.",
    rejectionReason: "Monthly income of 12,000 EGP below minimum 20,000 EGP for 4BR units"
  },
  {
    id: "app_007",
    userId: "user_003",
    projectId: "proj_002",
    status: "pending",
    priority: "high",
    submittedAt: "2024-03-15T10:30:00Z",
    reviewedAt: null,
    reviewedBy: null,
    applicationData: {
      requestedUnitType: "3BR",
      preferredFloor: "8-12",
      paymentMethod: "installments",
      specialRequirements: "Family floor plan"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded",
      bankStatements: "uploaded"
    },
    reviewNotes: null,
    rejectionReason: null
  },
  {
    id: "app_008",
    userId: "user_004",
    projectId: "proj_004",
    status: "approved",
    priority: "normal",
    submittedAt: "2024-03-20T16:00:00Z",
    reviewedAt: "2024-03-22T09:30:00Z",
    reviewedBy: "user_005",
    applicationData: {
      requestedUnitType: "Townhouse",
      preferredFloor: "Any",
      paymentMethod: "cash",
      specialRequirements: "Medical facility nearby"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      birthCertificate: "uploaded",
      professionalLicense: "uploaded",
      bankStatements: "uploaded"
    },
    reviewNotes: "High-income applicant, cash payment. Priority approval granted.",
    rejectionReason: null
  },
  {
    id: "app_009",
    userId: "user_001",
    projectId: "proj_003",
    status: "pending",
    priority: "normal",
    submittedAt: "2024-03-25T12:45:00Z",
    reviewedAt: null,
    reviewedBy: null,
    applicationData: {
      requestedUnitType: "Office",
      preferredFloor: "15-20",
      paymentMethod: "installments",
      specialRequirements: "Business license holder"
    },
    documents: {
      nationalIdCopy: "uploaded",
      incomeCertificate: "uploaded",
      businessLicense: "uploaded",
      taxRecords: "uploaded"
    },
    reviewNotes: null,
    rejectionReason: null
  }
];

// Helper functions for data access
export const getUserById = (userId) => {
  return UNIFIED_USERS.find(user => user.id === userId);
};

export const getProjectById = (projectId) => {
  return UNIFIED_PROJECTS.find(project => project.id === projectId);
};

export const getApplicationsByUserId = (userId) => {
  return UNIFIED_APPLICATIONS.filter(app => app.userId === userId);
};

export const getApplicationsByProjectId = (projectId) => {
  return UNIFIED_APPLICATIONS.filter(app => app.projectId === projectId);
};

export const getApplicationsByStatus = (status) => {
  return UNIFIED_APPLICATIONS.filter(app => app.status === status);
};

// Statistics functions
export const getApplicationStats = () => {
  const total = UNIFIED_APPLICATIONS.length;
  const pending = UNIFIED_APPLICATIONS.filter(app => app.status === 'pending').length;
  const approved = UNIFIED_APPLICATIONS.filter(app => app.status === 'approved').length;
  const rejected = UNIFIED_APPLICATIONS.filter(app => app.status === 'rejected').length;
  
  return { total, pending, approved, rejected };
};

export const getProjectStats = () => {
  return UNIFIED_PROJECTS.map(project => {
    const applications = getApplicationsByProjectId(project.id);
    return {
      projectId: project.id,
      projectName: project.name,
      totalApplications: applications.length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      pending: applications.filter(app => app.status === 'pending').length
    };
  });
};

// Export all data as a single object for API integration
export const UNIFIED_DATA = {
  users: UNIFIED_USERS,
  projects: UNIFIED_PROJECTS,
  applications: UNIFIED_APPLICATIONS,
  stats: {
    applications: getApplicationStats(),
    projects: getProjectStats()
  }
};
