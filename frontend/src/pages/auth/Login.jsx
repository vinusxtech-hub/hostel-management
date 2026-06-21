import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { LogIn, Eye, EyeOff, ArrowRightLeft } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();
  const { login, logout, user } = useAuth();
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
      console.log("Submitting login with state values:", { email, passwordLength: password.length });
      const newUser = await login(email, password);
      showSuccess(`Welcome back, ${newUser.name}!`);
      setTimeout(() => {
        navigate(
          newUser.role === "admin"
            ? "/admin/dashboard"
            : newUser.role === "warden"
            ? "/warden/dashboard"
            : newUser.role === "guard"
            ? "/guard/dashboard"
            : "/dashboard"
        );
      }, 500);
    } catch (err) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Account switch banner */}
      {user && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
          <span>Logged in as <strong>{user.name}</strong> ({user.role}). Enter new credentials to switch account.</span>
        </div>
      )}

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
          autoComplete="username"
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
            autoComplete="current-password"
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
        {isLoading ? "Signing in..." : user ? "Switch Account" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-semibold">
          Forgot Password?
        </Link>
      </p>

    </form>
  );
};
