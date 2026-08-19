import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  Compass, AlertTriangle, CheckCircle2, GraduationCap, 
  Loader2, Sparkles, BookOpen, Clock, BarChart
} from "lucide-react"
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts"

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

export const SkillGap = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/skill-gap")
        // Merge & validate response structure
        const validated = {
          target_role: "AI Engineer",
          gap_percentage: 0,
          current_skills: [],
          missing_skills: [],
          recommended_skills: [],
          ...res.data
        }
        setData(validated)
      } catch (err) {
        console.error("SkillGap API failed, falling back to default configuration", err)
        setData(null)
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
        <span>Evaluating Technology Skill Gaps...</span>
      </div>
    )
  }

  // Local fallback specific to SkillGap endpoints
  const fallback = {
    target_role: "AI Engineer",
    gap_percentage: 0,
    current_skills: [],
    missing_skills: [],
    recommended_skills: []
  }

  const activeData = data || fallback

  const currentSkillsList = Array.isArray(activeData.current_skills) ? activeData.current_skills : []
  const missingSkillsList = Array.isArray(activeData.missing_skills) ? activeData.missing_skills : []
  const recommendedSkillsList = Array.isArray(activeData.recommended_skills) ? activeData.recommended_skills : []

  // Prep data structures for Recharts Radar
  const radarChartData = [
    { subject: "Python", current: 90, target: 100 },
    { subject: "SQL", current: 70, target: 90 },
    { subject: "React", current: 50, target: 80 },
    { subject: "ML", current: 75, target: 95 },
    { subject: "Docker", current: 0, target: 85 },
    { subject: "AWS", current: 0, target: 85 }
  ]

  // Prep data structures for Recharts Bar with null protection and sanitization
  const barChartData = currentSkillsList.map(sk => ({
    name: sk?.name || "Skill",
    proficiency: safeNum(sk?.score)
  }))

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-purple-500" />
            AI Skill Gap Assessment
          </h1>
          <p className="text-sm text-slate-400">Real-time gap indexes relative to target role: <span className="text-white font-bold">{activeData.target_role || "AI Engineer"}</span></p>
        </div>
        <div className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl flex items-center gap-2 w-fit shadow-md">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <span>Technology Deficit: {safeNum(activeData.gap_percentage)}%</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between items-center shadow-xl">
          <div className="w-full flex justify-between items-center border-b border-white/5 pb-3 mb-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Target Competency Radar</h3>
            <span className="text-xs bg-purple-600/15 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-bold">Comparison Chart</span>
          </div>
          
          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" radius="70%" data={radarChartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#475569" }} />
                <Radar name="Current Skills" dataKey="current" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
                <Radar name="Target Competence" dataKey="target" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between items-center shadow-xl">
          <div className="w-full flex justify-between items-center border-b border-white/5 pb-3 mb-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Current Skill Proficiency</h3>
            <span className="text-xs bg-cyan-600/15 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-bold">Bar Matrix</span>
          </div>
          
          <div className="w-full h-80 flex items-center justify-center">
            {barChartData.length === 0 ? (
              <div className="text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-2 h-full border border-white/5 bg-slate-950/20 rounded-xl w-full py-20">
                <BarChart className="w-8 h-8 text-slate-650" />
                <span>No current proficiency metrics available to plot chart.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ReBarChart data={barChartData} margin={{ left: -10, right: 10 }}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="proficiency" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Skills Assessment Lists & Recommended learning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Current Skills list */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            Current Skill Vector
          </h3>
          
          <div className="space-y-4">
            {currentSkillsList.map((sk, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>{sk?.name || "Skill"}</span>
                  <span className="text-purple-400">{safeNum(sk?.score)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${safeNum(sk?.score)}%` }}></div>
                </div>
              </div>
            ))}
            {currentSkillsList.length === 0 && (
              <p className="text-xs text-slate-500 italic">No skills registered yet.</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            Identified Skill Gaps
          </h3>
          
          <div className="space-y-3.5">
            {missingSkillsList.map((sk, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-white/5 rounded-xl">
                <span className="text-sm font-bold text-slate-300">{sk}</span>
                <span className="px-3 py-1 text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                  MISSING
                </span>
              </div>
            ))}
            {missingSkillsList.length === 0 && (
              <p className="text-xs text-slate-500 italic">No technology gap detected.</p>
            )}
          </div>
        </div>

        {/* Recommended Learning Roadmap */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            Recommended Courses
          </h3>
          
          <div className="space-y-4">
            {recommendedSkillsList.map((course, idx) => (
              <div key={idx} className="p-4 bg-slate-950/80 border border-white/5 rounded-xl space-y-3 shadow-md">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  {course?.name || "Course"}
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="capitalize">Diff: {course?.difficulty || "Intermediate"}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {course?.duration || "Self-Paced"}
                  </span>
                </div>
              </div>
            ))}
            {recommendedSkillsList.length === 0 && (
              <p className="text-xs text-slate-500 italic">No recommended learning paths.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
export default SkillGap;
