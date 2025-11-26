# Quick Start Guide - EduMaster LMS

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Setup PostgreSQL
Make sure PostgreSQL is running locally or update the connection string in `backend/.env`

Create the database:
```bash
createdb edumaster
# Or using psql:
# psql -U postgres
# CREATE DATABASE edumaster;
```

### Step 3: Configure Environment
Create `backend/.env` file (copy from `.env.example` if available):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/edumaster
JWT_SECRET=change_this_to_a_random_secret_key
```

### Step 4: Create Admin User
```bash
cd backend
npm run seed:admin
```

### Step 5: Start the Application
```bash
# From root directory
npm run dev
```

This will start:
- Backend API at http://localhost:5000
- Frontend at http://localhost:3002

## 👤 Default Admin Credentials

After running the seed script:
- **Email**: admin@edumaster.com
- **Password**: admin123

**⚠️ Important**: Change the password after first login!

## 📝 Testing the System

### As a Student:
1. Register a new account with "Student" role
2. Browse courses at `/courses`
3. Enroll in a course
4. Access your dashboard at `/dashboard`
5. Watch lessons and take quizzes

### As an Instructor:
1. Register a new account with "Instructor" role
2. Go to Instructor Dashboard at `/instructor/dashboard`
3. Create a new course
4. Add lessons and create quizzes
5. Publish your course

### As an Admin:
1. Login with admin credentials
2. Access Admin Dashboard at `/admin/dashboard`
3. Manage users and courses
4. View analytics

## 🎨 Features Implemented

### ✅ Student Features
- Course browsing and search
- Course enrollment
- Lesson video player
- Quiz/exam attempts
- Progress tracking dashboard
- Lesson completion tracking

### ✅ Instructor Features
- Course creation and editing
- Lesson management
- Quiz builder
- Course publishing
- Enrollment monitoring

### ✅ Admin Features
- User management (create, update, delete, activate/deactivate)
- Course management and approval
- Analytics dashboard
- Platform overview statistics

### ✅ Technical Features
- JWT-based authentication
- Role-based authorization
- Protected routes
- Responsive UI with Tailwind CSS
- RESTful API architecture
- PostgreSQL database with Sequelize ORM

## 🔧 Development

### Run Backend Only
```bash
cd backend
npm run dev
```

### Run Frontend Only
```bash
cd frontend
npm run dev
```

### Create Admin User (Custom)
```bash
cd backend
node scripts/seedAdmin.js email@example.com password "User Name"
```

## 📁 Project Structure

```
LMS Portal/
├── backend/              # Node.js/Express API
│   ├── models/          # Sequelize models (PostgreSQL)
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── config/          # Database configuration
│   └── scripts/         # Utility scripts
├── frontend/            # React/TypeScript app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── context/     # Context providers
│   └── public/          # Static assets
└── README.md           # Full documentation
```

## 🐛 Troubleshooting

### PostgreSQL Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Verify PostgreSQL port (default: 5432)
- Ensure database exists: `createdb edumaster`

### Port Already in Use
- Backend: Change PORT in `backend/.env`
- Frontend: React will prompt to use different port

### Module Not Found
- Run `npm install` in both `backend/` and `frontend/` directories
- Delete `node_modules` and reinstall if issues persist

### CORS Errors
- Ensure backend is running before starting frontend
- Check API URL in frontend requests

## 📚 Next Steps

1. Customize the UI theme in `frontend/tailwind.config.js`
2. Add file upload functionality for videos and materials
3. Implement email notifications
4. Add payment integration
5. Deploy to production

## 💡 Tips

- Use pgAdmin or DBeaver to visualize your PostgreSQL database
- Check browser console for frontend errors
- Check terminal/console for backend logs
- All API endpoints are documented in `README.md`

Happy coding! 🎓


