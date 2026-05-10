"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { getInitials } from "@/lib/utils";
import { User, Mail, Phone, Home, Shield, Lock, Camera, Save, Eye, EyeOff } from "lucide-react";

const ROLE_GRADIENTS: Record<string, string> = {
  ADMIN: "from-violet-600 to-fuchsia-600",
  TREASURER: "from-emerald-500 to-teal-600",
  COMMITTEE: "from-blue-500 to-cyan-600",
  RESIDENT: "from-orange-400 to-rose-500",
  MAKER: "from-amber-500 to-orange-500",
  CHECKER: "from-indigo-500 to-blue-600",
  GUARD: "from-slate-500 to-gray-600",
  PLATFORM_ADMIN: "from-violet-600 to-fuchsia-600",
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const userRole = (user?.role || "").toUpperCase();
  const avatarGradient = ROLE_GRADIENTS[userRole] || "from-indigo-500 to-purple-600";

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      setUser(res.data.user);
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-10 gap-4">
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-br ${avatarGradient} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white`}>
                {getInitials(user?.first_name || "", user?.last_name || "")}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-4 h-4 text-gray-500" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>
            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
              <h2 className="text-xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
              <p className="text-gray-500 text-sm">{user?.role?.replace(/_/g, " ")}</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 transition-all"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
                <User className="w-3.5 h-3.5" /> First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
                />
              ) : (
                <p className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{user?.first_name}</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
                <User className="w-3.5 h-3.5" /> Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
                />
              ) : (
                <p className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{user?.last_name}</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <p className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
                />
              ) : (
                <p className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{user?.phone || "Not set"}</p>
              )}
            </div>
            {user?.flat_number && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
                  <Home className="w-3.5 h-3.5" /> Flat / Wing
                </label>
                <p className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">
                  {user?.wing ? `Wing ${user.wing} - ` : ""}{user.flat_number}
                </p>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
                <Shield className="w-3.5 h-3.5" /> Role
              </label>
              <p className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{user?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" });
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-400">Update your login password</p>
            </div>
          </div>
        </div>
        <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {passwordLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: "150ms" }}>
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Account Information</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">User ID</span>
            <span className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">{user?.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Society ID</span>
            <span className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">{user?.society_id || "Not assigned"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}