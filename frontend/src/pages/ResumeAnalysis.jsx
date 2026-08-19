import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  FileText, User, Mail, Phone, Compass, GraduationCap, Briefcase, 
  Award, Loader2, Sparkles, Terminal, Cpu, Database, Cloud, Layers, MapPin
} from "lucide-react"

const dashboardFallback = {
  user: {
    name: "User",
    email: ""
  },
  resume_score: 0,
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  skill_gap: {
    current_skills: [],
    missing_skills: [],
    recommended_skills: []
  },
  salary_prediction: {
    role: "Not Available",
    min_salary: 0,
    max_salary: 0,
    confidence: 0
  },
  recommendations: []
};

// Safe numeric sanitizer helper
const safeNum = (val) => {
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

export const ResumeAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(dashboardFallback)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/resume-analysis")
        const validated = {
          ...dashboardFallback,
          ...res.data
        }
        setData(validated)
      } catch (err) {
        console.error("ResumeAnalysis API failed, falling back to default configuration", err)
        setData(dashboardFallback)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-purple-500 font-bold text-lg">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span>Parsing Resume Intelligence...</span>
      </div>
    )
  }

  const activeData = data || dashboardFallback
  
  // Safe extraction of numeric and array elements
  const resumeScore = safeNum(activeData.resume_score)
  const skillsList = Array.isArray(activeData.skills) ? activeData.skills : []
  const educationList = Array.isArray(activeData.education) ? activeData.education : []
  const experienceList = Array.isArray(activeData.experience) ? activeData.experience : []

  // Group skills into categories for display
  const categorizeSkills = (skillsArray) => {
    const categories = {
      "Programming Languages": [],
      "Frameworks & Libraries": [],
      "Database & Analytics": [],
      "Cloud & DevOps": [],
      "AI & ML Core": []
    }
    
    skillsArray.forEach(skill => {
      if (!skill) return
      const lower = skill.toLowerCase()
      const programming = ["python", "javascript", "typescript", "go", "rust", "c++", "c#", "java"]
      const frameworks = ["react", "vue", "angular", "node.js", "node", "fastapi", "django", "flask", "express", "spring boot", "tailwind", "sass"]
      const database = ["sql", "postgresql", "mysql", "mongodb", "redis", "graphql", "rest api"]
      const cloud = ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git"]
      
      if (programming.includes(lower)) {
        categories["Programming Languages"].push(skill)
      } else if (frameworks.includes(lower)) {
        categories["Frameworks & Libraries"].push(skill)
      } else if (database.includes(lower)) {
        categories["Database & Analytics"].push(skill)
      } else if (cloud.includes(lower)) {
        categories["Cloud & DevOps"].push(skill)
      } else {
        categories["AI & ML Core"].push(skill)
      }
    })
    
    return categories
  }

  const categorized = categorizeSkills(skillsList)

  const candidateName = activeData.name || activeData.profile_summary?.name || activeData.user?.name || "Candidate"
  const candidateEmail = activeData.email || activeData.profile_summary?.email || activeData.user?.email || "candidate@domain.com"
  const candidatePhone = activeData.phone || activeData.profile_summary?.phone || "Not Available"

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-purple-500" />
            Resume Intelligence Center
          </h1>
          <p className="text-sm text-slate-400">Deep-dive structural parameters extracted from your uploaded resume.</p>
        </div>
        <div className="px-5 py-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold rounded-xl flex items-center gap-2 w-fit shadow-md">
          <Sparkles className="w-5 h-5 text-purple-450" />
          <span>ATS Quality Score: {resumeScore}/100</span>
        </div>
      </div>

      {/* A & B: Personal Info & AI Generated Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-5 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-6">
            <div className="flex items-center space-x-4 pb-4 border-b border-white/5">
              <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-3 rounded-2xl text-white">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Extracted Metadata</h3>
                <p className="text-xs text-slate-450 uppercase tracking-wider font-semibold">Personal Contact Coordinates</p>
              </div>
            </div>

            <div className="space-y-4 pt-1 text-sm">
              <div className="flex items-center space-x-3.5">
                <User className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300 font-bold">{candidateName}</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300">{candidateEmail}</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <Phone className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300">{candidatePhone}</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300">Mumbai, India</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed shadow-inner">
            Verify phone numbers and email paths directly in the database logs using SQL.
          </div>
        </div>

        {/* AI Summary card */}
        <div className="lg:col-span-7 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">AI Professional Synthesis</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pt-1">
            {activeData.summary || "No active summary parsed yet. Try uploading a complete PDF resume in the dashboard."}
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-purple-600/5 border border-purple-500/10 rounded-xl text-center shadow-md">
              <p className="text-2xl font-black text-white">{skillsList.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mt-1">Parsed Skills</p>
            </div>
            <div className="p-4 bg-cyan-600/5 border border-cyan-500/10 rounded-xl text-center shadow-md">
              <p className="text-2xl font-black text-white">{experienceList.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mt-1">Work Projects</p>
            </div>
            <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-xl text-center shadow-md">
              <p className="text-2xl font-black text-white">{educationList.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mt-1">Degree Maps</p>
            </div>
          </div>
        </div>

      </div>

      {/* C: Categorized Skills Grids */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <h3 className="text-base font-extrabold text-white uppercase tracking-wider border-b border-white/5 pb-3">
          Categorized Skill Matrices
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(categorized).map(([category, list]) => {
            if (!Array.isArray(list) || list.length === 0) return null
            return (
              <div key={category} className="p-5 bg-slate-950/80 border border-white/5 rounded-xl space-y-4 shadow-md">
                <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {list.map((sk, idx) => (
                    <span key={idx} className="px-3 py-1.5 text-xs font-bold bg-white/5 text-slate-300 border border-white/5 rounded-lg">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* D, E, F: Timelines (Education, Projects & Experiences) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Education Timeline */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Education Timeline</h3>
          </div>
          
          <div className="space-y-5 pt-2">
            {educationList.map((edu, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-purple-500/20">
                <div className="absolute top-1.5 left-0 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="text-sm font-bold text-white">{edu?.college || "College"}</div>
                <div className="text-xs text-purple-400 font-semibold mt-1">{edu?.degree || "Degree"}</div>
                <div className="text-xs text-slate-500 mt-1">Year: {edu?.year || "N/A"}</div>
              </div>
            ))}
            {educationList.length === 0 && (
              <p className="text-xs text-slate-500 italic">No education coordinates found.</p>
            )}
          </div>
        </div>

        {/* Experience Timeline */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <Briefcase className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Experience & Projects</h3>
          </div>
          
          <div className="space-y-5 pt-2">
            {experienceList.map((exp, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-cyan-500/20">
                <div className="absolute top-1.5 left-0 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full"></div>
                <div className="text-sm font-bold text-white">{exp?.title || "Project Title"}</div>
                <div className="text-xs text-cyan-400 font-semibold mt-1">{exp?.company || "Company"}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{exp?.description || "Description"}</p>
              </div>
            ))}
            {experienceList.length === 0 && (
              <p className="text-xs text-slate-500 italic">No project history found.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
export default ResumeAnalysis;
