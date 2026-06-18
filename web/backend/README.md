# Findoor Backend API

Complete Node.js/Express backend for the Findoor Government Housing System.

## 🚀 Features

- **RESTful APIs** for housing application management
- **MongoDB** database with Mongoose ODM
- **Input validation** using express-validator
- **CORS enabled** for frontend integration
- **Error handling** and logging
- **Pagination** and filtering support
- **Application statistics** endpoint

## 📁 Project Structure

```
backend/
├── controllers/
│   └── applicationController.js    # Business logic for applications
├── models/
│   ├── Application.js             # Application schema and model
│   └── Project.js                # Project schema and model
├── routes/
│   └── applications.js           # API routes for applications
├── .env.example                  # Environment variables template
├── .gitignore                   # Git ignore file
├── package.json                  # Dependencies and scripts
├── server.js                    # Main server file
└── README.md                    # This file
```

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/findoor
   PORT=5000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # For MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

5. **Run the server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Applications

| Method | Endpoint | Description | Request Body |
|---------|-----------|-------------|--------------|
| GET | `/api/applications` | Get all applications with pagination & filtering | Query params: `page`, `limit`, `status`, `search` |
| GET | `/api/applications/:id` | Get single application by ID | - |
| POST | `/api/applications` | Create new application | Application object |
| PUT | `/api/applications/:id/status` | Update application status | `{ status, rejectionReason?, reviewedBy? }` |
| GET | `/api/applications/stats` | Get application statistics | - |

### Health Check

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/health` | Server health check |

## 📝 Request/Response Examples

### Get All Applications
```bash
GET http://localhost:5000/api/applications?page=1&limit=10&status=pending
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d",
      "name": "Ahmed Mohamed",
      "nationalId": "12345678901234",
      "email": "ahmed@email.com",
      "phone": "01234567890",
      "projectId": "64f8a1b2c3d4e5f6a7b8c9e",
      "projectName": "Cairo Garden Residences",
      "income": 5000,
      "familySize": 4,
      "currentHousing": "Rented apartment",
      "status": "pending",
      "createdAt": "2024-03-22T10:30:00.000Z",
      "updatedAt": "2024-03-22T10:30:00.000Z"
    }
  ]
}
```

### Create Application
```bash
POST http://localhost:5000/api/applications
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sara Ahmed",
  "nationalId": "98765432109876",
  "email": "sara@email.com",
  "phone": "01987654321",
  "projectId": "64f8a1b2c3d4e5f6a7b8c9e",
  "projectName": "Alexandria Coastal Towers",
  "income": 7500,
  "familySize": 3,
  "currentHousing": "Family house"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d",
    "name": "Sara Ahmed",
    "nationalId": "98765432109876",
    "email": "sara@email.com",
    "phone": "01987654321",
    "projectId": "64f8a1b2c3d4e5f6a7b8c9e",
    "projectName": "Alexandria Coastal Towers",
    "income": 7500,
    "familySize": 3,
    "currentHousing": "Family house",
    "status": "pending",
    "createdAt": "2024-03-22T10:30:00.000Z",
    "updatedAt": "2024-03-22T10:30:00.000Z"
  }
}
```

### Update Application Status
```bash
PUT http://localhost:5000/api/applications/64f8a1b2c3d4e5f6a7b8c9d/status
Content-Type: application/json
```

**Request Body (Approve):**
```json
{
  "status": "approved",
  "reviewedBy": "Admin User"
}
```

**Request Body (Reject):**
```json
{
  "status": "rejected",
  "rejectionReason": "Income does not meet requirements",
  "reviewedBy": "Admin User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d",
    "name": "Sara Ahmed",
    "status": "approved",
    "reviewedAt": "2024-03-22T11:00:00.000Z",
    "reviewedBy": "Admin User"
  }
}
```

## 🧪 Testing with Postman

### 1. Import Collection
Copy the following Postman collection JSON and import into Postman:

```json
{
  "info": {
    "name": "Findoor API",
    "description": "API collection for Findoor Housing System"
  },
  "item": [
    {
      "name": "Get All Applications",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/applications",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api","applications"]
        }
      }
    },
    {
      "name": "Create Application",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"nationalId\": \"11112222333444\",\n  \"email\": \"test@email.com\",\n  \"phone\": \"01122334455\",\n  \"projectId\": \"507f1f77bcf86cd799439011\",\n  \"projectName\": \"Test Project\",\n  \"income\": \"5000\",\n  \"familySize\": \"4\",\n  \"currentHousing\": \"Rented apartment\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/applications",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api","applications"]
        }
      }
    },
    {
      "name": "Update Application Status",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"approved\",\n  \"reviewedBy\": \"Admin User\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/applications/:id/status",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api","applications",":id","status"]
        }
      }
    }
  ]
}
```

### 2. Test Steps

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **Open Postman** and import the collection

3. **Test each endpoint:**
   - Get all applications: `GET /api/applications`
   - Create application: `POST /api/applications`
   - Update status: `PUT /api/applications/:id/status`
   - Get statistics: `GET /api/applications/stats`

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/findoor` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🚨 Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## 📊 Database Schema

### Application Model
```javascript
{
  name: String (required, max 100)
  nationalId: String (required, unique, 14 digits)
  email: String (required, unique, valid email)
  phone: String (required, 01xxxxxxxxx format)
  projectId: ObjectId (required)
  projectName: String (required)
  income: Number (required, min 0)
  familySize: Number (required, 1-20)
  currentHousing: String (required, max 200)
  status: Enum [pending, approved, rejected] (default: pending)
  rejectionReason: String (max 500)
  reviewedBy: String
  reviewedAt: Date
  documents: {
    nationalIdCopy: String,
    incomeCertificate: String,
    birthCertificate: String
  }
  timestamps: true
}
```

## 🔄 Integration with React Frontend

Update your React frontend to use these API endpoints:

```javascript
// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Example API calls
const getApplications = async () => {
  const response = await fetch(`${API_BASE_URL}/applications`);
  return response.json();
};

const createApplication = async (applicationData) => {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(applicationData)
  });
  return response.json();
};

const updateApplicationStatus = async (id, statusData) => {
  const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statusData)
  });
  return response.json();
};
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check connection string in `.env` file
   - Verify MongoDB is accessible on specified port

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:5000 | xargs kill -9`

3. **CORS Issues**
   - Check FRONTEND_URL in `.env` file
   - Verify frontend URL matches your React dev server

4. **Validation Errors**
   - Check request body format
   - Ensure all required fields are included
   - Validate field formats (email, phone, nationalId)

## 📝 Development Notes

- **Validation**: All inputs are validated using express-validator
- **Error Logging**: Errors are logged to console
- **Database Indexes**: Optimized queries with proper indexes
- **Security**: Basic input sanitization and validation
- **Performance**: Pagination support for large datasets

## 🚀 Production Deployment

1. **Set NODE_ENV=production**
2. **Use production MongoDB URI**
3. **Enable HTTPS in production**
4. **Set up proper logging**
5. **Configure reverse proxy (nginx/Apache)**

---

**🎓 Findoor Government Housing System - Backend API**  
*Perfect for graduation project integration*
