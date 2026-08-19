import React from "react"
import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, UserCog, FileUp, Compass, Briefcase, GraduationCap, BadgeDollarSign
} from "lucide-react"

export const Sidebar: React.FC = () => {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Profile", path: "/dashboard/profile", icon: UserCog },
    { name: "Upload Resume", path: "/dashboard/upload", icon: FileUp },
    { name: "Skill Gap Analysis", path: "/dashboard/skill-gap", icon: Compass },
    { name: "AI Job Matching", path: "/dashboard/job-match", icon: Briefcase },
    { name: "Learning Paths", path: "/dashboard/courses", icon: GraduationCap },
    { name: "Salary Predictor", path: "/dashboard/salary-predict", icon: BadgeDollarSign },
  ]

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] glass-panel border-r border-glassBorder flex flex-col justify-between py-6 px-4 z-10 sticky left-0 top-16">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-4">
          Navigation
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-neonPurple/20 to-neonIndigo/20 text-white border-l-2 border-neonPurple"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 bg-slate-900/40 rounded-xl border border-glassBorder">
        <p className="text-xs font-semibold text-neonCyan mb-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-neonCyan rounded-full animate-ping"></span>
          AI Engine Active
        </p>
        <p className="text-[10px] text-slate-400">
          spacy-nlp & gpt models are loaded and processing career vectors.
        </p>
      </div>
    </aside>
  )
}
