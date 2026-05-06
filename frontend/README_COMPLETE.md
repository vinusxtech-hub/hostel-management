# Hostel Attendance Management System - Frontend

A complete production-ready React.js web application for managing hostel attendance with role-based access for students and administrators.

## 🎯 Features

### Student Portal
- **Dashboard**: Real-time attendance status with geolocation integration
- **Attendance**: Mark daily attendance and view history
- **Activity**: View attendance statistics and trends
- **Complaints**: Submit and track hostel complaints
- **Reports**: Comprehensive attendance analytics with charts
- **Profile**: Manage account information and settings

### Admin Portal
- **Dashboard**: Overview with key metrics and analytics
- **Students**: Manage student records with search and filtering
- **Attendance**: Monitor and manage attendance records
- **Reports**: Advanced analytics with department-wise breakdown

## 🛠 Tech Stack

- **React.js**: Modern UI library with functional components and hooks
- **React Router**: Client-side routing and navigation
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Beautiful charting library for analytics
- **Lucide React**: Icon library
- **Axios**: HTTP client for API calls
- **Context API**: State management
- **Vite**: Modern build tool and dev server

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── Badge.jsx           # Badge component
│   ├── Button.jsx          # Button component with variants
│   ├── Card.jsx            # Card container component
│   ├── Input.jsx           # Input field component
│   ├── Modal.jsx           # Modal dialog component
│   ├── Navbar.jsx          # Top navigation bar
│   ├── Sidebar.jsx         # Side navigation menu
│   ├── Skeleton.jsx        # Loading skeleton
│   ├── Loader.jsx          # Loading spinner
│   ├── ProtectedRoute.jsx  # Route protection wrapper
│   ├── Table.jsx           # Table component
│   └── Toast.jsx           # Toast notifications
├── layouts/                # Page layouts
│   ├── AuthLayout.jsx      # Authentication page layout
│   └── MainLayout.jsx      # Main application layout
├── pages/                  # Page components
│   ├── auth/
│   │   └── Login.jsx       # Login page
│   ├── student/
│   │   ├── Dashboard.jsx   # Student dashboard
│   │   ├── Attendance.jsx  # Mark attendance
│   │   ├── Activity.jsx    # Attendance history
│   │   ├── Complaints.jsx  # Submit complaints
│   │   ├── Reports.jsx     # Attendance reports
│   │   └── Profile.jsx     # User profile
│   └── admin/
│       ├── Dashboard.jsx   # Admin dashboard
│       ├── Students.jsx    # Manage students
│       ├── Attendance.jsx  # Attendance management
│       └── Reports.jsx     # Admin reports
├── hooks/                  # Custom React hooks
│   ├── useGeolocation.jsx  # Geolocation hook
│   └── useToast.jsx        # Toast notification hook
├── store/                  # State management
│   └── AuthContext.jsx     # Authentication context
├── services/               # API service layer
│   └── api.js             # Mock API endpoints
├── utils/                  # Utility functions
│   └── cn.js              # Class name utility
├── App.jsx                # Main app component
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## 🚀 Getting Started

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Or using yarn
yarn install
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🔐 Authentication

The application includes mock authentication with two demo accounts:

```
Student Account:
- Email: student@test.com
- Password: password

Admin Account:
- Email: admin@test.com
- Password: password
```

The authentication system uses:
- **Context API** for state management
- **Local Storage** for persisting user sessions
- **Protected Routes** to restrict access based on roles

## 📊 Components Overview

### Reusable Components

#### Button
```jsx
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```

#### Card
```jsx
<Card>
  <p>Card content</p>
</Card>
```

#### Input
```jsx
<Input label="Name" placeholder="Enter name" />
```

#### Modal
```jsx
<Modal isOpen={true} onClose={handleClose} title="Confirm">
  Modal content
</Modal>
```

#### Toast Notification
```jsx
const { toasts, removeToast, success, error } = useToast();
success("Action completed!");
error("Something went wrong!");
```

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark Mode Support**: Tailwind CSS with color schemes
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: Toast notifications and error messages
- **Smooth Animations**: CSS animations for better UX
- **Accessibility**: Semantic HTML and ARIA attributes

## 📱 Pages & Routes

### Student Routes
- `/login` - Login page
- `/dashboard` - Student dashboard
- `/attendance` - Mark and view attendance
- `/activity` - Attendance history
- `/complaints` - Submit/track complaints
- `/reports` - Attendance reports
- `/profile` - User profile

### Admin Routes
- `/admin/dashboard` - Admin dashboard
- `/admin/students` - Manage students
- `/admin/attendance` - Attendance management
- `/admin/reports` - Analytics & reports

## 🔄 API Integration

The application uses a mock API service located in `src/services/api.js`. It includes:

- **Student APIs**:
  - `getAttendanceHistory()` - Fetch attendance records
  - `markAttendance(location)` - Mark attendance
  - `getComplaints()` - Get complaints list
  - `submitComplaint(data)` - Submit new complaint

- **Admin APIs**:
  - `getDashboardStats()` - Get dashboard statistics
  - `getStudents()` - Get all students
  - (More endpoints can be added)

To connect to a real backend:
1. Replace API endpoints in `src/services/api.js`
2. Use Axios for HTTP requests
3. Handle authentication tokens

## 🎯 Key Features Implementation

### Geolocation
- Uses browser's Geolocation API
- Calculates distance from hostel
- Marks attendance as "Inside" or "Outside"
- Demo mode for testing

### Charts & Analytics
- Weekly attendance bar charts
- Monthly overview pie charts
- Trend analysis with line charts
- Department-wise statistics

### State Management
- User authentication via Context API
- Toast notifications with custom hook
- Local storage for persistent sessions

### Protected Routes
- Role-based access control
- Redirect unauthorized users
- Loading state handling

## 🧪 Testing

The application comes with mock data for immediate testing. To modify demo data:

1. Edit `src/services/api.js` to change mock data
2. Modify geolocation mock in `src/hooks/useGeolocation.jsx`
3. Add more demo users in `AuthContext.jsx`

## 📝 Customization

### Adding New Pages

1. Create a new file in `src/pages/[role]/`
2. Import and add route in `App.jsx`
3. Add navigation link in `Sidebar.jsx`

### Modifying Components

All components are in `src/components/` and use Tailwind CSS for styling.

### Changing Colors

Update color theme in `src/index.css`:
```css
@theme {
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
}
```

## 🚨 Error Handling

The application includes:
- Try-catch blocks for API calls
- Toast notifications for errors
- Fallback UI for loading states
- Validation for form inputs

## 📈 Performance Optimizations

- Code splitting with React lazy loading (can be added)
- Memoization for expensive components (can be added)
- Optimized re-renders with useCallback
- Efficient state management
- CSS minification via Tailwind

## 🔒 Security Considerations

For production deployment:
1. **Authentication**: Implement JWT tokens
2. **HTTPS**: Always use HTTPS
3. **CORS**: Configure properly
4. **Input Validation**: Validate all user inputs
5. **Sensitive Data**: Don't store sensitive info in localStorage
6. **API Security**: Implement rate limiting and authentication

## 📚 Dependencies

```json
{
  "dependencies": {
    "axios": "^1.16.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.14.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2",
    "recharts": "^3.8.1",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.4"
  }
}
```

## 🤝 Contributing

When adding new features:
1. Follow the existing folder structure
2. Use Tailwind CSS for styling
3. Add proper error handling
4. Update documentation
5. Test on multiple screen sizes

## 📄 License

This project is provided as-is for educational and commercial use.

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev)

## 🐛 Troubleshooting

### Module not found errors
```bash
npm install
```

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Tailwind CSS not working
```bash
npm install -D tailwindcss @tailwindcss/vite
```

### API calls failing
Check that mock API service is properly configured in `src/services/api.js`

## 📞 Support

For issues and questions:
1. Check the documentation above
2. Review component usage examples
3. Check browser console for errors
4. Verify dependencies are installed

---

**Built with ❤️ using React.js and Tailwind CSS**
