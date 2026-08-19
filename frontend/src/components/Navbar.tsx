import React from "react"
import { useAuth } from "../context/AuthContext"
import { LogOut, User as UserIcon, Bell, Sparkles } from "lucide-react"

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 w-full glass-panel border-b border-glassBorder flex items-center justify-between px-6 z-20 sticky top-0">
      <div className="flex items-center space-x-2">
        <div className="bg-gradient-to-tr from-neonPurple to-neonCyan p-2 rounded-lg">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <span className="font-extrabold text-lg bg-gradient-to-r from-white via-slate-200 to-neonCyan bg-clip-text text-transparent tracking-wide">
          CAREER INTEL
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neonCyan rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Authenticated user</p>
            <p className="text-sm font-semibold text-white">{user?.full_name || "Candidate"}</p>
          </div>
          
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-neonPurple"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserIcon className="w-5 h-5 text-slate-400" />
            </div>
          )}

          <button
            onClick={logout}
            className="p-1.5 rounded-full hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-all ml-2"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
