import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { Mail, Phone, MapPin, Building, LogOut, Shield, Users, Edit3, Save, X } from "lucide-react";

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

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-slide-in-down flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 tracking-tight">
            My Profile
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button variant="secondary" onClick={handleEdit}>
            <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <div className="animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
            <div className="h-32 w-32 rounded-[2rem] bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center text-5xl font-bold shrink-0 shadow-xl shadow-primary-500/30 transform hover:scale-105 transition-transform duration-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-center sm:text-left mt-2">
              <h2 className="text-3xl font-bold text-slate-900">{user?.name || 'User'}</h2>
              <p className="text-primary-600 capitalize flex items-center gap-2 mt-2 justify-center sm:justify-start font-medium bg-primary-50 w-fit px-4 py-1.5 rounded-full mx-auto sm:mx-0">
                <Shield className="w-4 h-4" />
                {user?.role || 'Student'}
              </p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 text-slate-700 bg-slate-50/50 p-3 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary-500"><Mail className="h-5 w-5" /></div>
                  <span className="font-medium">{user?.email || 'email@example.com'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-700 bg-slate-50/50 p-3 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary-500"><Building className="h-5 w-5" /></div>
                  <span className="font-medium">Room: {user?.room || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-700 bg-slate-50/50 p-3 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary-500"><Phone className="h-5 w-5" /></div>
                  <span className="font-medium">{user?.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-700 bg-slate-50/50 p-3 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary-500"><Users className="h-5 w-5" /></div>
                  <span className="font-medium">{user?.parentPhone || "Not provided"} <span className="text-slate-400 text-sm">(Parent)</span></span>
                </div>
                <div className="flex items-center gap-4 text-slate-700 bg-slate-50/50 p-3 rounded-xl sm:col-span-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary-500 shrink-0"><MapPin className="h-5 w-5" /></div>
                  <span className="font-medium truncate">{user?.address || "Address not provided"}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Settings */}
      <div className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <Card>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-100/80 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-500 mt-1">Receive updates via email</p>
              </div>
              <input type="checkbox" defaultChecked className="w-6 h-6 rounded text-primary-600 focus:ring-primary-500 accent-primary-600" />
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-100/80 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500 mt-1">Enhance account security</p>
              </div>
              <input type="checkbox" className="w-6 h-6 rounded text-primary-600 focus:ring-primary-500 accent-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
        <Card className="border-red-200 bg-red-50/50 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-red-700 mb-2">Danger Zone</h3>
          <p className="text-slate-600 mb-6">Logout from your account and end your session.</p>
          <Button variant="danger" size="lg" className="w-full sm:w-auto shadow-lg shadow-red-500/20" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout Securely
          </Button>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Room Number</label>
              <Input value={editData.room} onChange={(e) => setEditData({...editData, room: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <Input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent's Phone</label>
              <Input value={editData.parentPhone} onChange={(e) => setEditData({...editData, parentPhone: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <Input value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
