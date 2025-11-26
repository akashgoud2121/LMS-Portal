# EduMaster - Online Course & Exam Management System

A comprehensive Learning Management System (LMS) platform built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Features

### 🎓 Student Features
- Browse and enroll in courses
- Watch video lessons
- Attempt quizzes and exams
- Track learning progress
- View enrollment dashboard

### 👨‍🏫 Instructor Features
- Create and manage courses
- Add lessons with video content
- Build quizzes and exams
- Monitor course enrollments
- Manage course materials

### 👑 Admin Features
- Manage users (students, instructors)
- Oversee all courses
- View analytics and insights
- Activate/deactivate accounts
- Monitor platform activity

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management

### Backend
- **Node.js** with Express
- **PostgreSQL** with Sequelize ORM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Express Validator** for input validation
- **Multer** for file uploads

## Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher, local or cloud instance)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "LMS Portal"
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure Backend**
   - Navigate to `backend` directory
   - Create a `.env` file (copy from `.env.example` if available):
     ```env
     PORT=5000
     NODE_ENV=development
     DATABASE_URL=postgresql://username:password@localhost:5432/edumaster
     JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
     ```
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Change `JWT_SECRET` to a secure random string (use `openssl rand -base64 32`)

4. **Setup PostgreSQL Database**
   ```bash
   # Create database
   createdb edumaster
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE edumaster;
   ```

5. **Run the application**
   ```bash
   # From root directory - runs both frontend and backend
   npm run dev

   # Or run separately:
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

6. **Create Admin User**
   ```bash
   cd backend
   npm run seed:admin
   # Or with custom credentials:
   npm run seed:admin admin@example.com adminpassword "Admin Name"
   ```

7. **Access the application**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:5000

## Default User Roles

The system supports three roles:
- **Student**: Can enroll in courses and take quizzes
- **Instructor**: Can create and manage courses
- **Admin**: Full system access

> **Note**: First admin user can be created using the seed script above. Default credentials are admin@edumaster.com / admin123 (change password after first login).

## Project Structure

```
LMS Portal/
├── backend/
│   ├── models/          # Sequelize models (PostgreSQL)
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation middleware
│   ├── config/          # Database configuration
│   ├── uploads/         # Uploaded files (images, videos)
│   └── server.js        # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── context/     # Context providers
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main app component
│   └── public/          # Static assets
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (Instructor)
- `PUT /api/courses/:id` - Update course (Instructor/Owner)

### Enrollments
- `POST /api/enrollments/:courseId` - Enroll in course
- `GET /api/enrollments/my-enrollments` - Get student enrollments

### Quizzes
- `GET /api/quizzes/course/:courseId` - Get course quizzes
- `POST /api/quizzes` - Create quiz (Instructor)
- `POST /api/quizzes/:id/attempt` - Submit quiz attempt

### Admin
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user

## Usage Guide

### For Students
1. Register/Login with student role
2. Browse courses on the courses page
3. Click "Enroll" on any course
4. Access lessons from your dashboard
5. Complete quizzes to test your knowledge

### For Instructors
1. Register/Login with instructor role
2. Go to Instructor Dashboard
3. Create a new course
4. Add lessons and upload materials
5. Create quizzes for assessment
6. Publish your course

### For Admins
1. Login with admin account
2. Access Admin Dashboard
3. Manage users and courses
4. View analytics and reports

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs on http://localhost:3002 (Vite)
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` or `POSTGRESQL_URI` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS allowed origin (optional, defaults to *)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (optional, uses proxy in development)

## Future Enhancements

- [ ] File upload functionality for videos and materials
- [ ] Email notifications
- [ ] Certificate generation
- [ ] Discussion forums
- [ ] Payment integration
- [ ] Advanced analytics
- [ ] Mobile responsive improvements
- [ ] Video streaming optimization

## License

MIT License

## Support

For issues and questions, please open an issue in the repository.

