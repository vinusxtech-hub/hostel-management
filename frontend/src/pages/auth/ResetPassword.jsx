import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error: showError, success: showSuccess } = useToast();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showError("This reset link is missing a token");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.auth.resetPassword(token, password);
      showSuccess(data.message);
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
          <LockKeyhole className="w-4 h-4" />
          Invalid reset link
        </div>
        <p className="text-sm text-slate-600">
          The password reset token is missing. Request a new reset link to continue.
        </p>
        <Link to="/forgot-password">
          <Button className="w-full">Request New Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
          <LockKeyhole className="w-4 h-4" />
          Choose a new password
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Use a strong password with at least 6 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? "Updating password..." : "Reset Password"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Back to login
        </Link>
      </p>
    </div>
  );
};
