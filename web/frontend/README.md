# Online Government Housing System

A React.js graduation project that simulates the Ministry of Housing application system for Egyptian citizens.

## 📋 Project Overview

This is a complete Frontend MVP for an online government housing system that demonstrates:
- Citizen flow (registration, browsing projects, applying, tracking status)
- Admin flow (managing applications, approving/rejecting)
- Complete application lifecycle management

## 🛠️ Tech Stack

- **Frontend**: React.js with Vite
- **Routing**: React Router DOM
- **State Management**: Context API
- **Storage**: LocalStorage (no backend)
- **Styling**: Plain CSS (minimal, clean design)

## 🏗️ Project Structure

```
src/
 ├── pages/
 │    ├── Home.jsx              # Landing page with intro
 │    ├── Login.jsx             # User authentication
 │    ├── Register.jsx          # User registration
 │    ├── Projects.jsx          # Browse housing projects
 │    ├── ProjectDetails.jsx    # Detailed project view
 │    ├── Apply.jsx             # Application submission
 │    ├── Status.jsx            # Track applications
 │    └── AdminDashboard.jsx    # Admin management
 │
 ├── components/
 │    ├── Navbar.jsx            # Navigation with role-based links
 │    └── ProjectCard.jsx       # Project display component
 │
 ├── services/
 │    └── api.js                # Dummy API & localStorage functions
 │
 ├── context/
 │    └── AuthContext.jsx       # Authentication state management
 │
 ├── App.jsx                    # Main app with router setup
 ├── main.jsx                   # Entry point
 └── index.css                  # Global styles
```

## 🔐 Authentication System

**Fake Authentication using localStorage:**
- Email containing "admin" → Admin role
- Otherwise → Citizen role
- User data stored in localStorage:
  ```javascript
  {
    name,
    email,
    role, // 'admin' or 'citizen'
    password,
    nationalId
  }
  ```

## 📱 Features

### Citizen Features
- ✅ User registration and login
- ✅ Browse available housing projects
- ✅ View detailed project information
- ✅ Submit housing applications with document upload
- ✅ Track application status
- ✅ Search and filter projects

### Admin Features
- ✅ View all applications
- ✅ Approve/reject applications
- ✅ Search and filter applications
- ✅ View application statistics
- ✅ Delete applications

### Project Management
- ✅ 5 dummy housing projects with realistic data
- ✅ Project details with pricing and availability
- ✅ Search and filter functionality
- ✅ Responsive grid layout

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd housing-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## 👥 Demo Accounts

### Citizen Account
- **Email**: citizen@example.com
- **Password**: 123456

### Admin Account
- **Email**: admin@example.com
- **Password**: 123456

## 📊 Dummy Data

The system includes:
- **5 Housing Projects** with realistic Egyptian locations and pricing
- **Project Features**: Security, parking, amenities, etc.
- **Application Forms**: Complete with validation and document upload
- **Status Tracking**: Pending, Approved, Rejected states

## 🎯 User Flows

### Citizen Flow
1. Register/Login → 2. Browse Projects → 3. View Details → 4. Apply → 5. Track Status

### Admin Flow
1. Login (admin) → 2. View Dashboard → 3. Review Applications → 4. Approve/Reject

## 📝 Key Pages

### Home Page
- Introduction to the housing system
- Navigation buttons based on authentication status
- Features and how-it works sections

### Projects Page
- Grid layout of available housing projects
- Search and filter functionality
- Project statistics

### Application Form
- Comprehensive form with validation
- Document upload simulation
- Terms and conditions

### Admin Dashboard
- Application management table
- Statistics overview
- Search and filter capabilities

## 🔧 Technical Implementation

### State Management
- **AuthContext**: Global authentication state
- **LocalStorage**: Persistent data storage
- **Component State**: Local UI state

### API Simulation
- **projectsAPI**: Project data management
- **applicationsAPI**: Application CRUD operations
- **usersAPI**: User authentication
- **utils**: Helper functions for formatting

### Routing
- **Protected Routes**: Role-based access control
- **Navigation**: Dynamic navbar based on user role
- **Redirects**: Automatic redirects after login/logout

## 🎨 Design Principles

- **Clean & Minimal**: Focus on functionality over aesthetics
- **Responsive**: Works on desktop and mobile devices
- **Accessible**: Semantic HTML and proper labeling
- **User-Friendly**: Clear navigation and feedback

## 📚 Educational Value

This project demonstrates:
- React.js component architecture
- Context API for state management
- React Router for navigation
- Form handling and validation
- LocalStorage for data persistence
- Role-based access control
- Responsive design principles

## 🚫 Limitations

- **No Real Backend**: Uses localStorage only
- **No Real File Upload**: Simulated file upload
- **No Email Notifications**: Status updates only in UI
- **Demo Data Only**: Not connected to real government systems

## 📄 License

This is a graduation project for educational purposes only.

## 🤝 Contributing

This is a student project - not accepting contributions at this time.

---

**Note**: This is a demonstration project for academic purposes. No real personal data should be submitted, and the system does not connect to actual government services.
