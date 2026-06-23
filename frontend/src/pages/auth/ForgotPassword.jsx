import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";

export const ForgotPassword = () => {
  const { error: showError, success: showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.auth.forgotPassword(email.trim());
      showSuccess(data.message);
    } catch (err) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
          <KeyRound className="w-4 h-4" />
          Reset your password
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Enter your account email and we&apos;ll prepare a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? "Preparing reset link..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Back to login
        </Link>
      </p>
    </div>
  );
};
