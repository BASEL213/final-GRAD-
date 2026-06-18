const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Load data from data.json
let data;
try {
  data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data.json'), 'utf8'));
  console.log('✅ Loaded data from data.json');
} catch (error) {
  console.error('❌ Error loading data.json:', error);
  data = { users: [], projects: [], applications: [], auditLogs: [], notifications: [] };
}

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper functions
const saveData = () => {
  try {
    fs.writeFileSync(path.join(__dirname, '../data.json'), JSON.stringify(data, null, 2));
    console.log('✅ Data saved to data.json');
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Housing System API is running with local storage',
    timestamp: new Date().toISOString()
  });
});

// Base API endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Housing System API Server',
    version: '1.0.0',
    endpoints: {
      projects: '/api/projects',
      users: '/api/users',
      applications: '/api/applications',
      health: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Projects endpoints
app.get('/api/projects', (req, res) => {
  try {
    res.json({
      success: true,
      count: data.projects.length,
      data: data.projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const newProject = {
      id: `proj_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.projects.push(newProject);
    saveData();
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
});

// Users endpoints
app.get('/api/users', (req, res) => {
  try {
    res.json({
      success: true,
      count: data.users.length,
      data: data.users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Applications endpoints
app.get('/api/applications', (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedApplications = data.applications.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      count: data.applications.length,
      total: data.applications.length,
      page: parseInt(page),
      pages: Math.ceil(data.applications.length / limit),
      data: paginatedApplications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

app.post('/api/applications', (req, res) => {
  try {
    const newApplication = {
      id: `app_${Date.now()}`,
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.applications.push(newApplication);
    saveData();
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// PUT endpoint for updating applications
app.put('/api/applications/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = data.applications.findIndex(app => app.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    data.applications[index] = {
      ...data.applications[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    saveData();
    
    res.json({
      success: true,
      message: 'Application updated successfully',
      data: data.applications[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
});

// DELETE endpoint for projects
app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = data.projects.findIndex(proj => proj.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const deletedProject = data.projects[index];
    data.projects.splice(index, 1);
    saveData();
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: deletedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Housing System API Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Projects API: http://localhost:${PORT}/api/projects`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📝 Applications API: http://localhost:${PORT}/api/applications`);
  console.log(`💾 Using local data.json storage`);
});
