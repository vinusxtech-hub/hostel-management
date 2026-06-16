import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    hostelSection: "",
    room: "",
    phone: "",
    department: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.student.getSettings();
        setDepartments(data.departments || []);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showError("Name, email and password are required");
      return;
    }

    if (formData.password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        hostelSection: formData.hostelSection,
        room: formData.room,
        phone: formData.phone,
        department: formData.department
      });
      showSuccess(`Welcome, ${user.name}! Account created successfully.`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          <UserPlus className="w-4 h-4" />
          Create Student Account
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name *
          </label>
          <Input
            id="name"
            name="name"
            placeholder="e.g. Ankit Kumar"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password *
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm Password *
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label htmlFor="hostelSection" className="block text-sm font-medium text-slate-700 mb-1.5">
            Hostel Section
          </label>
          <select
            id="hostelSection"
            name="hostelSection"
            value={formData.hostelSection}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white text-sm"
          >
            <option value="">Select</option>
            <option value="boys">Boys Hostel</option>
            <option value="girls">Girls Hostel</option>
          </select>
        </div>
        <div>
          <label htmlFor="room" className="block text-sm font-medium text-slate-700 mb-1.5">
            Room Number
          </label>
          <Input
            id="room"
            name="room"
            placeholder="e.g. A-101"
            value={formData.room}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            placeholder="+91-XXXXXXXXXX"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1.5">
            Department
          </label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white text-sm"
          >
            <option value="">Select</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Log in
        </Link>
      </p>
    </form>
  );
};
