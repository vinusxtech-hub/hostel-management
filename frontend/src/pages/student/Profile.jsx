import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import {
  Building,
  Edit3,
  Eye,
  EyeOff,
  Home,
  Key,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Hash,
  MapPin,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getHostelSectionLabel = (value) => {
  if (value === "boys") return "Boys Hostel";
  if (value === "girls") return "Girls Hostel";
  return "Not assigned";
};

const getRoleTheme = (role) => {
  const themes = {
    warden: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-100 text-violet-700 border-violet-200", ring: "ring-violet-300", accent: "text-violet-700", btn: "from-violet-600 to-indigo-700" },
    admin:  { gradient: "from-slate-700 to-slate-900",   badge: "bg-slate-100 text-slate-700 border-slate-200",  ring: "ring-slate-300",  accent: "text-slate-700",  btn: "from-slate-700 to-slate-900"  },
    guard:  { gradient: "from-orange-500 to-red-600",    badge: "bg-orange-100 text-orange-700 border-orange-200", ring: "ring-orange-300", accent: "text-orange-700", btn: "from-orange-500 to-red-600"  },
    student:{ gradient: "from-sky-500 to-cyan-600",      badge: "bg-sky-100 text-sky-700 border-sky-100",        ring: "ring-sky-300",    accent: "text-sky-700",    btn: "from-sky-500 to-cyan-600"    },
  };
  return themes[role] || themes.student;
};

const getRoleLabel = (role) => {
  const labels = { student: "Student", admin: "Administrator", warden: "Hostel Warden", guard: "Hostel Guard" };
  return labels[role] || role || "User";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="p-2 bg-slate-50 rounded-lg mt-0.5 flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{value || <span className="text-slate-400 font-normal italic">Not provided</span>}</p>
    </div>
  </div>
);

const FormField = ({ label, type = "text", value, onChange, placeholder = "", hint, required, disabled, rightElement }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
          disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 hover:border-slate-300"
        } ${rightElement ? "pr-10" : ""}`}
      />
      {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
    </div>
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const PasswordField = ({ label, value, onChange, placeholder, hint }) => {
  const [show, setShow] = useState(false);
  return (
    <FormField
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      hint={hint}
      rightElement={
        <button type="button" onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const theme = useMemo(() => getRoleTheme(user?.role), [user?.role]);
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);

  // Profile edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    parentPhone: user?.parentPhone || "",
    address: user?.address || "",
    department: user?.department || "",
    room: user?.room || "",
  });

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleOpenEdit = () => {
    setEditData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      parentPhone: user?.parentPhone || "",
      address: user?.address || "",
      department: user?.department || "",
      room: user?.room || "",
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editData.name.trim()) { showError("Name is required"); return; }
    if (!editData.email.trim()) { showError("Email is required"); return; }

    setIsSaving(true);
    try {
      const result = await api.auth.updateProfile(editData);
      updateUser(result.user);
      setShowEditModal(false);
      success("Profile updated successfully!");
    } catch (err) {
      showError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) { showError("Enter your current password"); return; }
    if (!passwordData.newPassword) { showError("Enter a new password"); return; }
    if (passwordData.newPassword.length < 6) { showError("Password must be at least 6 characters"); return; }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) { showError("New passwords do not match"); return; }

    setIsChangingPassword(true);
    try {
      await api.auth.updateProfile(passwordData);
      setPasswordSuccess(true);
      success("Password changed successfully! A confirmation email has been sent.");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      }, 2500);
    } catch (err) {
      showError(err.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  // Password strength indicator
  const getPasswordStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Too short", color: "bg-red-400", width: "w-1/4" };
    if (pw.length < 8) return { label: "Weak", color: "bg-orange-400", width: "w-2/4" };
    if (!/[A-Z]/.test(pw) || !/\d/.test(pw)) return { label: "Fair", color: "bg-yellow-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
  };
  const pwStrength = getPasswordStrength(passwordData.newPassword);

  const contactRows = [
    { icon: Mail, label: "Email Address", value: user?.email },
    { icon: Phone, label: "Phone Number", value: user?.phone },
    ...(user?.role === "student" ? [
      { icon: Users, label: "Parent / Guardian Phone", value: user?.parentPhone },
      { icon: Home, label: "Home Address", value: user?.address },
      { icon: BookOpen, label: "Department", value: user?.department },
      { icon: Hash, label: "Room Number", value: user?.room },
    ] : [
      { icon: BookOpen, label: "Department", value: user?.department },
      { icon: Home, label: "Address", value: user?.address },
    ]),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Hero Card ── */}
      <div className={`rounded-3xl bg-gradient-to-br ${theme.gradient} p-6 sm:p-8 shadow-2xl shadow-slate-400/20 text-white`}>
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-white/20 ring-4 ring-white/30 flex items-center justify-center text-3xl font-extrabold flex-shrink-0`}>
            {getInitials(user?.name)}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{user?.name}</h1>
            <p className="text-white/75 text-sm mt-1 truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/15 border border-white/20`}>
                <Shield className="w-3.5 h-3.5" />{roleLabel}
              </span>
              {user?.hostelSection && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/15 border border-white/20">
                  <Building className="w-3.5 h-3.5" />{getHostelSectionLabel(user.hostelSection)}
                  {user.building ? ` — Building ${user.building}` : ""}
                </span>
              )}
              {user?.createdAt && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/15 border border-white/20">
                  Joined {formatDate(user.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/80 hover:bg-red-500 border border-red-400/40 text-white rounded-xl text-sm font-semibold transition-all ml-auto"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Contact & Details ── */}
      <Card className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-slate-100 rounded-xl">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
            <p className="text-xs text-slate-500">Your personal and contact details on record.</p>
          </div>
        </div>
        {contactRows.map(row => (
          <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
        ))}
      </Card>

      {/* ── Security Card ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Account Security</h2>
            <p className="text-xs text-slate-500">Manage your login credentials.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">Password</p>
            <p className="text-xs text-slate-500 mt-0.5">For security, change your password regularly. A confirmation email is sent on change.</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${theme.btn} text-white text-sm font-semibold whitespace-nowrap shadow-md hover:opacity-90 transition-all`}
          >
            <Key className="w-4 h-4" /> Change Password
          </button>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
           Edit Profile Modal
      ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <p className="text-sm text-slate-500">Update your profile details below. Changing your email will update your login username.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <FormField
                label="Full Name"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                placeholder="e.g. Ankit Kumar"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                label="Email Address (Login Username)"
                type="email"
                value={editData.email}
                onChange={e => setEditData({ ...editData, email: e.target.value })}
                placeholder="e.g. ankit@example.com"
                hint="Changing this will update your login email."
                required
              />
            </div>
            <FormField
              label="Phone Number"
              type="tel"
              value={editData.phone}
              onChange={e => setEditData({ ...editData, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
            <FormField
              label="Department"
              value={editData.department}
              onChange={e => setEditData({ ...editData, department: e.target.value })}
              placeholder="e.g. Computer Science"
            />
            {user?.role === "student" && (
              <>
                <FormField
                  label="Room Number"
                  value={editData.room}
                  onChange={e => setEditData({ ...editData, room: e.target.value })}
                  placeholder="e.g. A-101"
                />
                <FormField
                  label="Parent / Guardian Phone"
                  type="tel"
                  value={editData.parentPhone}
                  onChange={e => setEditData({ ...editData, parentPhone: e.target.value })}
                  placeholder="e.g. 9800000000"
                />
                <div className="sm:col-span-2">
                  <FormField
                    label="Home Address"
                    value={editData.address}
                    onChange={e => setEditData({ ...editData, address: e.target.value })}
                    placeholder="e.g. 123 MG Road, Bhopal"
                  />
                </div>
              </>
            )}
            {(user?.role === "warden" || user?.role === "guard") && (
              <div className="sm:col-span-2">
                <FormField
                  label="Address"
                  value={editData.address}
                  onChange={e => setEditData({ ...editData, address: e.target.value })}
                  placeholder="e.g. 123 MG Road, Bhopal"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${theme.btn} text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all shadow-md`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
           Change Password Modal
      ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordSuccess(false); setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" }); }} title="Change Password">
        {passwordSuccess ? (
          <div className="flex flex-col items-center py-6 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Password Changed!</p>
              <p className="text-sm text-slate-500 mt-1">A confirmation email has been sent to <strong>{user?.email}</strong></p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">You will receive a confirmation email at <strong>{user?.email}</strong> after the password is changed.</p>
            </div>

            <PasswordField
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter your current password"
            />

            <PasswordField
              label="New Password"
              value={passwordData.newPassword}
              onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Minimum 6 characters"
            />

            {/* Password strength bar */}
            {passwordData.newPassword && pwStrength && (
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pwStrength.color} ${pwStrength.width}`} />
                </div>
                <p className={`text-xs font-medium ${
                  pwStrength.label === "Strong" ? "text-emerald-600" :
                  pwStrength.label === "Fair" ? "text-yellow-600" : "text-orange-600"
                }`}>{pwStrength.label}</p>
              </div>
            )}

            <PasswordField
              label="Confirm New Password"
              value={passwordData.confirmNewPassword}
              onChange={e => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
              placeholder="Re-enter new password"
            />

            {passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Passwords do not match
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${theme.btn} text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all shadow-md`}
              >
                <Lock className="w-4 h-4" />
                {isChangingPassword ? "Changing..." : "Change Password"}
              </button>
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" }); }}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
