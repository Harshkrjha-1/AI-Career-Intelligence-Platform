import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Settings as SettingsIcon, Moon, Sun, Bell, Lock, 
  Trash2, LogOut, CheckCircle2, ShieldAlert, Loader2 
} from "lucide-react";

export const Settings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [emailNotifs, setEmailNotifs] = useState(true);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    if (selectedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post("/user/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("WARNING: This will permanently delete your account and all parsed resume records. Continue?")) {
      try {
        await api.delete("/user/account");
        alert("Account deleted.");
        localStorage.clear();
        navigate("/login");
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete account.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-purple-500" />
            Account Settings & Preferences
          </h1>
          <p className="text-sm text-slate-400">
            Manage your interface theme, notification channels, authentication credentials, and privacy configurations.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        
        {/* Section 1: Appearance & Theme */}
        <div className="bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <Sun className="w-4 h-4 text-purple-400" />
            Appearance Theme
          </h3>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              onClick={() => toggleTheme("dark")}
              className={`p-4 rounded-xl border flex items-center justify-center gap-3 font-bold text-sm transition-all ${
                theme === "dark" 
                  ? "bg-purple-600/20 border-purple-500 text-purple-300" 
                  : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode (Recommended)</span>
            </button>

            <button
              onClick={() => toggleTheme("light")}
              className={`p-4 rounded-xl border flex items-center justify-center gap-3 font-bold text-sm transition-all ${
                theme === "light" 
                  ? "bg-purple-600/20 border-purple-500 text-purple-300" 
                  : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <Bell className="w-4 h-4 text-cyan-400" />
            Notifications & Alerts
          </h3>
          <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-white/5 rounded-xl">
            <div>
              <p className="text-sm font-bold text-white">Email Career Digests</p>
              <p className="text-xs text-slate-400 mt-0.5">Receive job market match recommendations and ATS optimization alerts.</p>
            </div>
            <button
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`w-12 h-6 rounded-full transition-all relative ${
                emailNotifs ? "bg-purple-600" : "bg-slate-800"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                emailNotifs ? "right-1" : "left-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Section 3: Password Update Form */}
        <form onSubmit={handlePasswordChange} className="bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <Lock className="w-4 h-4 text-indigo-400" />
            Security & Authentication
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-350 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-350 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-350 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>

        {/* Section 4: Account Actions & Danger Zone */}
        <div className="bg-slate-900/60 backdrop-blur border border-red-500/20 rounded-2xl p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-500/10 pb-3">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Account Management & Session
          </h3>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1">
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-purple-400" />
              <span>Sign Out Session</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account Permanently</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
