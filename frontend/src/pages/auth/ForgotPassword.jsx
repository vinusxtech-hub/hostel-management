import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, KeyRound, ArrowRight, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";

export const ForgotPassword = () => {
  const { error: showError, success: showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewToken, setPreviewToken] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState(15);

  const resetLink = previewToken ? `/reset-password?token=${encodeURIComponent(previewToken)}` : "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.auth.forgotPassword(email.trim());
      setPreviewToken(data.previewToken || "");
      setExpiresInMinutes(data.expiresInMinutes || 15);
      showSuccess(data.message);
    } catch (err) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyResetLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${resetLink}`);
      showSuccess("Reset link copied");
    } catch {
      showError("Unable to copy the reset link");
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

      {previewToken && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Reset link ready</p>
              <p className="text-sm text-emerald-800">
                This demo environment shows the reset link directly. It expires in {expiresInMinutes} minutes.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-emerald-100 px-3 py-2 text-sm text-slate-700 break-all">
            {window.location.origin}
            {resetLink}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={resetLink} className="flex-1">
              <Button className="w-full gap-2">
                Open Reset Form
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button type="button" variant="secondary" onClick={copyResetLink} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Back to login
        </Link>
      </p>
    </div>
  );
};
