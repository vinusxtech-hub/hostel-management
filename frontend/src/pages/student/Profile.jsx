import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import {
  Building,
  CalendarDays,
  Edit3,
  Home,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Sparkles,
  UserCircle2,
  Users,
  X
} from "lucide-react";

const getInitials = (name) => {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};

const formatDate = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const getHostelSectionLabel = (value) => {
  if (value === "boys") return "Boys Hostel";
  if (value === "girls") return "Girls Hostel";
  return "Not assigned";
};

const getRoleLabel = (role) => {
  if (!role) return "User";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getRoleTheme = (role) => {
  if (role === "warden") {
    return {
      accent: "text-violet-700",
      accentSoft: "text-violet-600",
      surface: "from-violet-50 via-white to-indigo-50",
      avatar: "from-violet-700 via-violet-600 to-indigo-600",
      chip: "border-violet-100 bg-violet-50 text-violet-700"
    };
  }

  if (role === "admin") {
    return {
      accent: "text-slate-800",
      accentSoft: "text-slate-600",
      surface: "from-slate-100 via-white to-slate-50",
      avatar: "from-slate-800 via-slate-700 to-slate-600",
      chip: "border-slate-200 bg-white text-slate-700"
    };
  }

  return {
    accent: "text-sky-700",
    accentSoft: "text-sky-600",
    surface: "from-sky-50 via-white to-cyan-50",
    avatar: "from-sky-700 via-sky-600 to-cyan-600",
    chip: "border-sky-100 bg-sky-50 text-sky-700"
  };
};

const getRoleProfileConfig = (user) => {
  if (user?.role === "warden") {
    return {
      title: "Warden Profile",
      badge: "Warden account",
      subtitle: "Professional account summary for hostel supervision, communication, and section ownership.",
      canEdit: false,
      showStudentFields: false
    };
  }

  if (user?.role === "admin") {
    return {
      title: "Admin Profile",
      badge: "Administrator account",
      subtitle: "Core administrator identity and access information for the hostel platform.",
      canEdit: false,
      showStudentFields: false
    };
  }

  return {
    title: "Student Profile",
    badge: "Student profile",
    subtitle: "Manage your account details and keep hostel records accurate for support, attendance, and leave workflows.",
    canEdit: true,
    showStudentFields: true
  };
};

const InfoTile = ({ icon: Icon, label, value, hint, toneClass = "bg-white/80" }) => (
  <div className={`rounded-2xl border border-slate-200 p-4 shadow-sm shadow-slate-200/40 ${toneClass}`}>
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "Not provided"}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  </div>
);

const MetricCard = ({ label, value, subtext, gradient }) => (
  <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-sm shadow-slate-200/50">
    <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
    <div className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtext}</p>
    </div>
  </div>
);

export const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    parentPhone: user?.parentPhone || "",
    address: user?.address || "",
    room: user?.room || "",
    department: user?.department || ""
  });

  const profileConfig = useMemo(() => getRoleProfileConfig(user), [user]);
  const theme = useMemo(() => getRoleTheme(user?.role), [user?.role]);
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);
  const hostelSectionLabel = useMemo(() => getHostelSectionLabel(user?.hostelSection), [user?.hostelSection]);
  const accountStartDate = user?.joinedAt || user?.createdAt;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleEdit = () => {
    setEditData({
      name: user?.name || "",
      phone: user?.phone || "",
      parentPhone: user?.parentPhone || "",
      address: user?.address || "",
      room: user?.room || "",
      department: user?.department || ""
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.student.updateProfile(editData);
      updateUser(updated);
      setIsEditing(false);
      success("Profile updated successfully!");
    } catch (err) {
      error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const overviewStats = profileConfig.showStudentFields
    ? [
        { label: "Hostel Section", value: hostelSectionLabel, subtext: "Current hostel assignment", gradient: "from-sky-500 to-cyan-500" },
        { label: "Room", value: user?.room || "Not set", subtext: "Hostel room identity", gradient: "from-indigo-500 to-blue-500" },
        { label: "Department", value: user?.department || "Not set", subtext: "Academic department", gradient: "from-emerald-500 to-teal-500" }
      ]
    : [
        { label: "Hostel Section", value: hostelSectionLabel, subtext: "Current section ownership", gradient: "from-violet-500 to-indigo-500" },
        { label: "Assigned Hostel", value: hostelSectionLabel, subtext: "Current section ownership", gradient: "from-fuchsia-500 to-violet-500" },
        { label: "Status", value: "Active", subtext: "Account availability", gradient: "from-emerald-500 to-green-500" }
      ];

  const contactTiles = profileConfig.showStudentFields
    ? [
        { icon: Mail, label: "Email address", value: user?.email, hint: "Primary login identity", toneClass: "bg-white/80" },
        { icon: Phone, label: "Phone number", value: user?.phone, hint: "Used for day-to-day communication", toneClass: "bg-white/80" },
        { icon: Users, label: "Parent contact", value: user?.parentPhone, hint: "Emergency family contact", toneClass: "bg-white/80" },
        { icon: Home, label: "Home address", value: user?.address, hint: "Permanent address on record", toneClass: "bg-white/80" }
      ]
    : [
        { icon: Mail, label: "Email address", value: user?.email, hint: "Primary account email", toneClass: "bg-white/80" },
        { icon: Phone, label: "Phone number", value: user?.phone, hint: "Used for section coordination", toneClass: "bg-white/80" },
        { icon: Home, label: "Address", value: user?.address, hint: "Current address on file", toneClass: "bg-white/80" }
      ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br ${theme.surface} shadow-xl shadow-slate-200/60`}>
        <div className="p-6 sm:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/85 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
              <Sparkles className={`h-4 w-4 ${theme.accentSoft}`} />
              {profileConfig.badge}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className={`flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-gradient-to-br ${theme.avatar} text-2xl font-bold text-white shadow-lg shadow-slate-400/30`}>
                {getInitials(user?.name)}
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {user?.name || profileConfig.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">{profileConfig.subtitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium ${theme.chip}`}>
                    <Shield className="h-4 w-4" />
                    {roleLabel}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium ${theme.chip}`}>
                    <Building className="h-4 w-4" />
                    {hostelSectionLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/90 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
                    <Mail className={`h-4 w-4 ${theme.accentSoft}`} />
                    {user?.email || "No email"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {overviewStats.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  subtext={item.subtext}
                  gradient={item.gradient}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {profileConfig.canEdit && (
                <Button onClick={handleEdit}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              <Button variant={profileConfig.canEdit ? "secondary" : "primary"} onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Contact Information</h2>
              <p className="text-sm text-slate-500">The main contact details attached to this account.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {contactTiles.map((item) => (
              <InfoTile
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                hint={item.hint}
                toneClass={item.toneClass}
              />
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Account Snapshot</h2>
            <p className="text-sm text-slate-500">A quick summary of how this account appears in the hostel system.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile
            icon={CalendarDays}
            label="Created"
            value={formatDate(accountStartDate)}
            hint="Initial account start date"
            toneClass="bg-slate-50"
          />
          <InfoTile
            icon={Shield}
            label="Role access"
            value={roleLabel}
            hint={profileConfig.showStudentFields ? "Student self-service access" : "Operational access level"}
            toneClass="bg-slate-50"
          />
          <InfoTile
            icon={Building}
            label="Section on file"
            value={hostelSectionLabel}
            hint={profileConfig.showStudentFields ? "Linked to your hostel assignment" : "Current responsibility section"}
            toneClass="bg-slate-50"
          />
        </div>
      </Card>

      {profileConfig.canEdit && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile" className="max-w-2xl">
          <div className="space-y-5">
            <p className="text-sm text-slate-500">
              Update the details that help the hostel team contact you and identify your records correctly.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
              <Input
                label="Room Number"
                value={editData.room}
                onChange={(e) => setEditData({ ...editData, room: e.target.value })}
              />
              <Input
                label="Phone"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
              <Input
                label="Parent's Phone"
                value={editData.parentPhone}
                onChange={(e) => setEditData({ ...editData, parentPhone: e.target.value })}
              />
              <Input
                label="Department"
                value={editData.department}
                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
