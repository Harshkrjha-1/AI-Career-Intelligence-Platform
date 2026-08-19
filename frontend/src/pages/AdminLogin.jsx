import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import { Sparkles, Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react"

export const AdminLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.post("/admin/login", { email, password })
      localStorage.setItem("access_token", res.data.access_token)
      localStorage.setItem("token", res.data.access_token)
      localStorage.setItem("is_admin", "true")
      navigate("/admin/dashboard")
    } catch (err) {
      setError(err.response?.data?.detail || "Access denied: Invalid credentials or not an administrator.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B111E] px-4 relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur p-8 rounded-2xl border border-white/5 z-10 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-red-500 to-purple-600 p-3 rounded-2xl mb-4 text-white shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Platform Admin</h2>
          <p className="text-sm text-slate-400 mt-1">Authenticate administrator access credentials</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3.5 mb-6 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Admin Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@careerintel.com"
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Admin Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-600/10 flex items-center justify-center space-x-2 transition-all mt-4 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Admin Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin;
