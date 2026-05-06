# Full-Stack Hostel Attendance System — MongoDB + JWT + Google Maps Upgrade

Transform the current mock-data application into a production-ready full-stack system with MongoDB persistence, JWT authentication, real-time geolocation verification with Google Maps, and a Signup page.

## Current State Analysis

The existing codebase has:
- ✅ Frontend: React + Vite + Tailwind CSS v4 with good UI/UX (glassmorphism, animations, responsive sidebar layout)
- ✅ Backend: Express.js server running on port 5000
- ✅ Pages: Login, Student (Dashboard, Attendance, Activity, Complaints, Reports, Profile), Admin (Dashboard, Students, Attendance, Reports)
- ✅ Components: Card, Button, Input, Modal, Loader, Skeleton, Toast, Badge, Table, Sidebar, Navbar, ProtectedRoute
- ❌ **No MongoDB** — all data is in-memory arrays
- ❌ **No JWT** — login is mock (hardcoded email/password)
- ❌ **No Signup page** — only Login
- ❌ **No Google Maps** — uses raw `navigator.geolocation` only
- ❌ **No backend location validation** — geofencing is frontend-only
- ❌ **No Mongoose models**
- ❌ **No auth middleware**
- ❌ **No .env files**
- ❌ Student Reports page uses hardcoded static data, not from API

## User Review Required

> [!IMPORTANT]
> **Google Maps API Key**: You will need a valid Google Maps JavaScript API key. You can get one from the [Google Cloud Console](https://console.cloud.google.com/). The key will be stored in `frontend/.env` as `VITE_GOOGLE_MAPS_API_KEY`. For now I will set it to a placeholder.

> [!IMPORTANT]
> **MongoDB Connection**: You need MongoDB running locally on `mongodb://localhost:27017` or a MongoDB Atlas connection string. The URI will be stored in `backend/.env` as `MONGO_URI`.

## Proposed Changes

### Backend — Database Layer

#### [NEW] [backend/.env](file:///f:/HostelAttendanceweb/backend/.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hostel_attendance
JWT_SECRET=hostel_attendance_super_secret_key_2026
JWT_EXPIRES_IN=7d
HOSTEL_LAT=28.6139
HOSTEL_LNG=77.2090
GEOFENCE_RADIUS_METERS=200
```

#### [NEW] [backend/src/config/db.js](file:///f:/HostelAttendanceweb/backend/src/config/db.js)
- MongoDB connection using Mongoose
- Connection error handling and retry logic

---

### Backend — Mongoose Models

#### [NEW] [backend/src/models/User.js](file:///f:/HostelAttendanceweb/backend/src/models/User.js)
- Fields: `name`, `email`, `password` (hashed with bcrypt), `role` (student/admin), `room`, `phone`, `parentPhone`, `address`, `department`, `createdAt`
- Pre-save middleware to hash password
- Method to compare passwords

#### [NEW] [backend/src/models/Attendance.js](file:///f:/HostelAttendanceweb/backend/src/models/Attendance.js)
- Fields: `userId` (ref → User), `date`, `timestamp`, `latitude`, `longitude`, `distance`, `status` (Present/Late/Absent), `location` (Inside/Outside)
- Compound unique index on `(userId, date)` — prevents duplicate daily entries

#### [NEW] [backend/src/models/Complaint.js](file:///f:/HostelAttendanceweb/backend/src/models/Complaint.js)
- Fields: `userId` (ref → User), `category`, `description`, `status` (Pending/In Progress/Resolved/Rejected), `adminResponse`, `createdAt`, `updatedAt`

---

### Backend — Auth System

#### [NEW] [backend/src/middleware/auth.js](file:///f:/HostelAttendanceweb/backend/src/middleware/auth.js)
- `protect` middleware: Verify JWT from `Authorization: Bearer <token>` header
- `adminOnly` middleware: Check `req.user.role === 'admin'`

#### [NEW] [backend/src/routes/authRoutes.js](file:///f:/HostelAttendanceweb/backend/src/routes/authRoutes.js)
- `POST /api/auth/register` — Create new student account
- `POST /api/auth/login` — Authenticate and return JWT + user data
- `GET /api/auth/me` — Get current user from token

#### [NEW] [backend/src/controllers/authController.js](file:///f:/HostelAttendanceweb/backend/src/controllers/authController.js)
- `register`: Validate input, check duplicate email, hash password, create user, return JWT
- `login`: Validate credentials, compare hashed password, return JWT + user object
- `getMe`: Return user data from JWT

---

### Backend — Updated Controllers (MongoDB)

#### [MODIFY] [studentController.js](file:///f:/HostelAttendanceweb/backend/src/controllers/studentController.js)
- Replace in-memory arrays with Mongoose queries
- `getAttendanceHistory`: Query `Attendance` collection filtered by `req.user._id`
- `markAttendance`: **Backend geofence validation** — calculate distance using Haversine formula, reject if outside radius. Store lat/lng, timestamp, calculated distance. Prevent duplicate daily entries.
- `getComplaints`: Query `Complaint` collection filtered by `req.user._id`
- `submitComplaint`: Create new Complaint document linked to user
- `getProfile` / `updateProfile`: New endpoints for editable profile

#### [MODIFY] [adminController.js](file:///f:/HostelAttendanceweb/backend/src/controllers/adminController.js)
- Replace in-memory arrays with Mongoose queries
- `getDashboardStats`: Aggregate queries for today's counts
- `getStudents`: Query all users with role=student, include latest attendance status
- `getAttendance`: Query attendance records with user population, filter by date
- `getReports`: Aggregate monthly/weekly/department-wise statistics from real data
- `getComplaints` / `updateComplaint`: View all complaints, update status

---

### Backend — Updated Routes

#### [MODIFY] [studentRoutes.js](file:///f:/HostelAttendanceweb/backend/src/routes/studentRoutes.js)
- Add `protect` middleware to all routes
- Add profile routes: `GET /profile`, `PUT /profile`

#### [MODIFY] [adminRoutes.js](file:///f:/HostelAttendanceweb/backend/src/routes/adminRoutes.js)
- Add `protect` + `adminOnly` middleware to all routes
- Add complaint management routes: `GET /complaints`, `PUT /complaints/:id`

#### [MODIFY] [index.js](file:///f:/HostelAttendanceweb/backend/src/index.js)
- Add MongoDB connection on startup
- Add auth routes mount: `app.use('/api/auth', authRoutes)`
- Add seed script runner for initial admin user

---

### Backend — Seed Script

#### [NEW] [backend/src/seed.js](file:///f:/HostelAttendanceweb/backend/src/seed.js)
- Create default admin: `admin@test.com` / `password`
- Create sample students with realistic data
- Create sample attendance records and complaints
- Run on first startup or via `npm run seed`

---

### Frontend — Auth & API Updates

#### [NEW] [frontend/.env](file:///f:/HostelAttendanceweb/frontend/.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
VITE_HOSTEL_LAT=28.6139
VITE_HOSTEL_LNG=77.2090
```

#### [MODIFY] [api.js](file:///f:/HostelAttendanceweb/frontend/src/services/api.js)
- Use `VITE_API_URL` env variable for base URL
- Add JWT token in `Authorization` header for all requests
- Add `auth.login()`, `auth.register()`, `auth.getMe()` endpoints
- Add profile endpoints
- Add admin complaint management endpoints

#### [MODIFY] [AuthContext.jsx](file:///f:/HostelAttendanceweb/frontend/src/store/AuthContext.jsx)
- Replace mock login with real API call to `/api/auth/login`
- Store JWT token in localStorage
- Add `register` function
- Add `updateProfile` function
- Load user from token on app init via `/api/auth/me`

---

### Frontend — New Signup Page

#### [NEW] [frontend/src/pages/auth/Signup.jsx](file:///f:/HostelAttendanceweb/frontend/src/pages/auth/Signup.jsx)
- Registration form: name, email, password, confirm password, room number, phone
- Role selection (student only — admin created via seed)
- Form validation
- Link to Login page
- Matching premium glassmorphism design

#### [MODIFY] [Login.jsx](file:///f:/HostelAttendanceweb/frontend/src/pages/auth/Login.jsx)
- Replace mock credentials hint with "Don't have an account? Sign up" link
- Use real API login

#### [MODIFY] [AuthLayout.jsx](file:///f:/HostelAttendanceweb/frontend/src/layouts/AuthLayout.jsx)
- Support both Login and Signup routes

#### [MODIFY] [App.jsx](file:///f:/HostelAttendanceweb/frontend/src/App.jsx)
- Add `/signup` route under AuthLayout

---

### Frontend — Google Maps Integration

#### [NEW] [frontend/src/components/MapView.jsx](file:///f:/HostelAttendanceweb/frontend/src/components/MapView.jsx)
- Google Maps component using `@vis.gl/react-google-maps` library
- Show hostel location as fixed marker (red)
- Show student's live location marker (blue)
- Draw geofence circle (200m radius) around hostel
- Display distance calculation
- Show "Inside" / "Outside" status visually

#### [MODIFY] [useGeolocation.jsx](file:///f:/HostelAttendanceweb/frontend/src/hooks/useGeolocation.jsx)
- Remove demo override (random Inside/Outside)
- Use actual Haversine distance calculation only
- Use hostel coordinates from env variables
- Better error handling for GPS denied/unavailable

#### [MODIFY] [student/Dashboard.jsx](file:///f:/HostelAttendanceweb/frontend/src/pages/student/Dashboard.jsx)
- Integrate MapView component showing live location
- Use proper geolocation hook (no demo randomness)
- Send real lat/lng to backend for validation

---

### Frontend — Dynamic Data Pages

#### [MODIFY] [student/Reports.jsx](file:///f:/HostelAttendanceweb/frontend/src/pages/student/Reports.jsx)
- Replace all hardcoded `barData`, `monthlyData`, `pieData` with API data
- Fetch from backend `/api/student/reports` endpoint

#### [MODIFY] [student/Profile.jsx](file:///f:/HostelAttendanceweb/frontend/src/pages/student/Profile.jsx)
- Add editable profile form (name, phone, parentPhone, address)
- Save via API call to `/api/student/profile`

#### [MODIFY] [admin/Dashboard.jsx](file:///f:/HostelAttendanceweb/frontend/src/pages/admin/Dashboard.jsx)
- Replace hardcoded chart data with dynamic data from stats API
- Replace hardcoded "Quick Stats" with real aggregated data

---

### Frontend — Miscellaneous

#### [MODIFY] [index.html](file:///f:/HostelAttendanceweb/frontend/index.html)
- Update `<title>` to "HostelTrack — Attendance Management"
- Add meta description for SEO

---

### Backend — Package Dependencies

#### [MODIFY] [backend/package.json](file:///f:/HostelAttendanceweb/backend/package.json)
Add dependencies:
- `mongoose` — MongoDB ODM
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT tokens

### Frontend — Package Dependencies

#### [MODIFY] [frontend/package.json](file:///f:/HostelAttendanceweb/frontend/package.json)
Add dependency:
- `@vis.gl/react-google-maps` — Google Maps React integration

---

## File Summary

| Action | File | Purpose |
|--------|------|---------|
| NEW | `backend/.env` | Environment variables |
| NEW | `backend/src/config/db.js` | MongoDB connection |
| NEW | `backend/src/models/User.js` | User model |
| NEW | `backend/src/models/Attendance.js` | Attendance model |
| NEW | `backend/src/models/Complaint.js` | Complaint model |
| NEW | `backend/src/middleware/auth.js` | JWT auth middleware |
| NEW | `backend/src/routes/authRoutes.js` | Auth routes |
| NEW | `backend/src/controllers/authController.js` | Auth controller |
| NEW | `backend/src/seed.js` | Database seeder |
| MODIFY | `backend/src/index.js` | Add MongoDB + auth routes |
| MODIFY | `backend/src/controllers/studentController.js` | MongoDB queries |
| MODIFY | `backend/src/controllers/adminController.js` | MongoDB queries |
| MODIFY | `backend/src/routes/studentRoutes.js` | Add auth middleware |
| MODIFY | `backend/src/routes/adminRoutes.js` | Add auth middleware |
| NEW | `frontend/.env` | Frontend env variables |
| NEW | `frontend/src/pages/auth/Signup.jsx` | Signup page |
| NEW | `frontend/src/components/MapView.jsx` | Google Maps component |
| MODIFY | `frontend/src/services/api.js` | JWT + real endpoints |
| MODIFY | `frontend/src/store/AuthContext.jsx` | Real auth system |
| MODIFY | `frontend/src/App.jsx` | Add signup route |
| MODIFY | `frontend/src/pages/auth/Login.jsx` | Real API login |
| MODIFY | `frontend/src/layouts/AuthLayout.jsx` | Support signup |
| MODIFY | `frontend/src/hooks/useGeolocation.jsx` | Real geolocation |
| MODIFY | `frontend/src/pages/student/Dashboard.jsx` | Map + real data |
| MODIFY | `frontend/src/pages/student/Reports.jsx` | Dynamic data |
| MODIFY | `frontend/src/pages/student/Profile.jsx` | Editable profile |
| MODIFY | `frontend/src/pages/admin/Dashboard.jsx` | Dynamic charts |
| MODIFY | `frontend/index.html` | SEO meta tags |

## Verification Plan

### Automated Tests
1. `npm install` in backend — verify dependencies install
2. `npm run seed` — verify seed data created in MongoDB  
3. `npm run dev` (both servers) — verify no startup errors
4. `npm run build` in frontend — verify build succeeds
5. Browser test: Full login → attendance → complaints flow

### Manual Verification
- Test signup → login → mark attendance flow in browser
- Verify geolocation prompt appears and map renders
- Verify attendance is persisted in MongoDB after marking
- Verify admin can see student data dynamically
- Verify JWT token is sent in API headers
- Test location outside geofence → attendance rejected
