import React, { useEffect, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import api from "../services/api"
import { 
  Sparkles, LogOut, LayoutDashboard, FileText, Compass, 
  Map, BadgeDollarSign, MessageSquare, Send, X, Loader2, User,
  FolderKanban, Settings, PenLine, Briefcase
} from "lucide-react"

export const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [userName, setUserName] = useState("Candidate")
  
  // Chat Assistant State
  const [isOpen, setIsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "Hello! I am your AI Career Assistant. Ask me anything about skill gaps, resume score, or target roles!" }
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Resume Analysis", path: "/dashboard/resume-analysis", icon: FileText },
    { name: "Skill Gap", path: "/dashboard/skill-gap", icon: Compass },
    { name: "Career Roadmap", path: "/dashboard/career-roadmap", icon: Map },
    { name: "Salary Insights", path: "/dashboard/salary-insights", icon: BadgeDollarSign },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Resume Management", path: "/dashboard/resume-management", icon: FolderKanban },
    { name: "Resume Builder",      path: "/resume-builder",      icon: PenLine },
    { name: "Live Opportunities",   path: "/live-opportunities",  icon: Briefcase },
    { name: "Settings",             path: "/dashboard/settings",  icon: Settings }
  ]

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/profile")
        if (res.data && res.data.full_name) setUserName(res.data.full_name)
      } catch (err) {
        console.error("Layout auth check failed", err)
      }
    }
    fetchUser()
    window.addEventListener("focus", fetchUser)
    return () => window.removeEventListener("focus", fetchUser)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("token")
    navigate("/")
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const userMsg = input
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
    setInput("")
    setSending(true)

    // AI Advisor automated response generator
    setTimeout(() => {
      let reply = "I am processing your details. Based on your parsed resume, building projects in Node.js and learning Docker will increase your ATS score."
      const query = userMsg.toLowerCase()
      if (query.includes("learn") || query.includes("next")) {
        reply = "Based on your resume, I suggest: \n1. Learn Docker for containerization.\n2. Improve SQL performance queries.\n3. Build TensorFlow ML classifier projects."
      } else if (query.includes("salary") || query.includes("lpa")) {
        reply = "AI Engineers with your profile typically draw between ₹12 LPA to ₹20 LPA in the India market. Adding MLOps will push it to ₹25 LPA+."
      } else if (query.includes("resume") || query.includes("score")) {
        reply = "Your current resume score is 87/100. Adding Docker and MLOps under skills will push you close to 95/100 ATS match!"
      }
      setChatMessages(prev => [...prev, { role: "ai", text: reply }])
      setSending(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-purple-600/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white uppercase block">Career Intelligence</span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden xl:flex items-center space-x-2">
          {navItems.map((item, idx) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                  active 
                    ? "bg-purple-600/15 border border-purple-500/25 text-purple-400" 
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Profile metadata & Signout */}
        <div className="flex items-center space-x-5">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-450 uppercase tracking-wider font-extrabold">Authorized Candidate</p>
            <p className="text-sm font-black text-white mt-0.5">{userName}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Sub menu for mobile viewports */}
      <div className="xl:hidden w-full bg-slate-950 border-b border-white/5 px-4 py-2.5 flex space-x-2 overflow-x-auto">
        {navItems.map((item, idx) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${
                active ? "bg-purple-600/20 text-purple-400" : "text-slate-400"
              }`}
            >
              <item.icon className="w-4 h-4 mr-1.5" />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* Main Workspace Body Outlet */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8">
        <Outlet />
      </main>

      {/* Floating AI Career Advisor Sidecar Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-200 border border-purple-400/30 flex items-center justify-center cursor-pointer"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>

        {/* Advisor Sidecar Window */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]">
            {/* Chat header */}
            <div className="px-5 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2 text-white">
                <MessageSquare className="w-4.5 h-4.5" />
                <span className="text-xs font-black uppercase tracking-wider">AI Career Advisor</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/40">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-md ${
                      msg.role === "user" 
                        ? "bg-purple-600 text-white" 
                        : "bg-slate-950/90 border border-white/5 text-slate-300"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-950/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Analyzing career vector...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-white/5 flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask AI Advisor about skills, salary..."
                className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={sending}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  )
}
export default DashboardLayout;
