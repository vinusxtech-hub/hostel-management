import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { LogIn, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }
    setIsLoading(true);

    try {
      const user = await login(email, password);
      showSuccess(`Welcome back, ${user.name}!`);
      setTimeout(() => {
        navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
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
          <LogIn className="w-4 h-4" />
          Sign in to your account
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-semibold">
          Create one
        </Link>
      </p>

      <div className="border-t border-slate-200 pt-4 mt-4">
        <p className="text-center text-xs text-slate-500">
          Demo Accounts — <span className="font-medium">Password: password</span>
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <button type="button" onClick={() => { setEmail("student@test.com"); setPassword("password"); }}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors">
            Student
          </button>
          <button type="button" onClick={() => { setEmail("admin@test.com"); setPassword("password"); }}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors">
            Admin
          </button>
        </div>
      </div>
    </form>
  );
};
