# Secure Course Registration and Drop System

A secure web-based application designed for managing course registrations, drops, and academic policies with a strong emphasis on security and data integrity.

## 🚀 Key Features

### 🔐 Security & Authentication
- **Role-Based Access Control (RBAC)**: Secure access for Students, Faculty, and Administrators.
- **Enhanced Authentication**: 
  - JWT (JSON Web Tokens) for session management.
  - Integration of **bcrypt** for password hashing and salting.
  - OTP (One-Time Password) generation and verification capabilities.
- **Data Protection**:
  - **AES Encryption**: Sensitive data is encrypted at rest using `crypto-js`.
  - **Integrity Hashing**: SHA-256 implementation to ensure audit logs and critical records are tamper-proof.
  - **Input Validation**: Robust validation using `express-validator` to prevent injection attacks.
  - **Rate Limiting**: API protection against brute-force and DDoS attacks.
  - **Security Headers**: comprehensive security headers using `helmet`.

### 📚 Course Management
- **Course Administration**: Admin interface to create, update, and manage course offerings.
- **Registration Workflow**: 
  - Students can browse available courses.
  - Real-time checks for prerequisites and capacity.
  - Secure course registration and drop functionality.
- **Waitlist Management**: Automated handling of course waitlists (implied by complex registration logic).

### 👥 User Roles
- **Admin**: Full system control, user management, policy configuration, and audit log review.
- **Faculty**: Manage their assigned courses and view enrollments.
- **Student**: Register for courses, view schedule, and manage academic progress.

### 🛡️ Audit & Compliance
- **Audit Logging**: Comprehensive tracking of all critical system actions (logins, registrations, policy changes).
- **Tamper-Evident Logs**: Each log entry is cryptographically linked or hashed to detect unauthorized modifications.

### ⚙️ System Policies
- **Dynamic Policies**: Administrators can configure system-wide rules (e.g., registration windows, max credit limits) without code changes.

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Security**: 
  - `bcryptjs` (Password Hashing)
  - `crypto-js` (Encryption & Hashing)
  - `express-rate-limit` (Rate Limiting)
  - `helmet` (HTTP Headers)
  - `jsonwebtoken` (Auth)
  - `express-validator` (Validation)

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **UI Components**: 
  - Lucide React (Icons)
  - React Hot Toast (Notifications)
  - Custom CSS Modules (Responsive Design)

## 📂 Project Structure

```
cyber/
├── backend/                # Node.js/Express Backend
│   ├── src/
│   │   ├── config/         # Database & App Configuration
│   │   ├── controllers/    # Request Handling Logic
│   │   ├── middleware/     # Auth, Validation, Rate Limiting
│   │   ├── models/         # Mongoose Schemas (User, Course, AuditLog)
│   │   ├── routes/         # API Endpoint Definitions
│   │   ├── utils/          # Encryption, Hashing, Token Utils
│   │   └── app.js          # App Entry Point
│   └── package.json
│
└── frontend/               # React Frontend
    ├── src/
    │   ├── components/     # Reusable UI Components (Navbar, ProtectedRoute)
    │   ├── pages/          # Application Pages (Login, Dashboard, Courses)
    │   └── App.jsx         # Main Component
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- MongoDB (Local or Atlas connection string)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` root with the following:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/secure-course-system
   JWT_SECRET=your_jwt_secret_key
   ENCRYPTION_KEY=your_encryption_key
   NODE_ENV=development
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security Best Practices Implemented
- **Least Privilege**: Middleware ensures users can only access routes relevant to their role.
- **Secure Defaults**: Helmet sets strict HTTP headers to prevent XSS, clickjacking, etc.
- **Sanitization**: All inputs are validated and sanitized before processing.
- **Audit Trails**: Every administrative action is logged for accountability.
