import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  Map, Sparkles, AlertCircle, Briefcase, GraduationCap, 
  ArrowRight, Loader2, Award, Compass, TrendingUp
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

export const CareerRoadmap = () => {
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/dashboard")
        const validated = {
          ...dashboardFallback,
          ...res.data
        }
        setRecommendations(validated.recommendations || validated.career_recommendations || [])
      } catch (err) {
        console.error("Failed to load career recommendations", err)
        setRecommendations([])
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
        <span>Generating Career Transition Paths...</span>
      </div>
    )
  }

  const fallbackRecommendations = [
    {
      role: "AI Engineer",
      match: 92,
      skills: ["TensorFlow", "Deep Learning", "FastAPI"],
      avg_salary: "₹15 LPA",
      demand: "High"
    },
    {
      role: "Data Scientist",
      match: 86,
      skills: ["Python", "SQL", "Pandas"],
      avg_salary: "₹12 LPA",
      demand: "High"
    },
    {
      role: "ML Engineer",
      match: 82,
      skills: ["PyTorch", "MLOps", "Docker"],
      avg_salary: "₹14 LPA",
      demand: "Medium"
    }
  ]

  const activeRecommendations = Array.isArray(recommendations) && recommendations.length > 0 
    ? recommendations 
    : fallbackRecommendations

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <Map className="w-6 h-6 text-purple-500" />
            AI Career Roadmap Engine
          </h1>
          <p className="text-sm text-slate-400">Personalized matching vectors showing optimal transitions and technology targets.</p>
        </div>
        <div className="px-5 py-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold rounded-xl flex items-center gap-2 w-fit shadow-md">
          <Sparkles className="w-5 h-5 text-purple-450" />
          <span>Calculated Matches</span>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-6">
        {activeRecommendations.map((rec, idx) => (
          <div key={idx} className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-xl">
            
            {/* Left Box: Match score & metadata (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-5 pr-0 lg:pr-8 border-r-0 lg:border-r border-white/5">
              <div>
                <span className="px-3.5 py-1 text-xs font-bold bg-purple-600/15 text-purple-400 border border-purple-500/20 rounded-md uppercase tracking-wider">
                  Transition Recommendation
                </span>
                <h3 className="text-lg font-black text-white mt-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-455" />
                  {rec?.role || "Target Role"}
                </h3>
              </div>

              {/* Progress and scores */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Match Index</span>
                  <span className="text-cyan-400">{rec?.match || 0}% Match Rating</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${rec?.match || 0}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center pt-2">
                <div className="p-3 bg-slate-950 border border-white/5 rounded-xl shadow-md">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Target Salary</span>
                  <span className="text-sm font-bold text-white mt-1 block">{rec?.avg_salary || "Not Available"}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-white/5 rounded-xl shadow-md">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Job Demand</span>
                  <span className="text-sm font-bold text-green-400 mt-1 block">{rec?.demand || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Right Box: Learning Path Steps & Target Skills (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              
              {/* Target Skills */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Technology Gaps to Close</h4>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(rec?.skills) ? rec.skills : []).map((skill, sIdx) => (
                    <span key={sIdx} className="px-3.5 py-1.5 text-xs font-bold bg-purple-600/5 text-purple-300 border border-purple-500/10 rounded-lg">
                      {skill}
                    </span>
                  ))}
                  {(Array.isArray(rec?.skills) ? rec.skills : []).length === 0 && (
                    <span className="text-xs text-slate-500 italic">No specific technology gaps identified.</span>
                  )}
                </div>
              </div>

              {/* Suggested Step-by-Step Learning Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  Target Learning Roadmap
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 border border-white/5 rounded-xl relative shadow-md">
                    <span className="absolute top-2 right-2.5 text-[10px] text-purple-500 font-extrabold tracking-wider">STEP 1</span>
                    <h5 className="text-xs font-bold text-white pr-8">Core Theory</h5>
                    <p className="text-[11px] text-slate-500 mt-1">Study framework structures and API endpoints.</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-white/5 rounded-xl relative shadow-md">
                    <span className="absolute top-2 right-2.5 text-[10px] text-purple-500 font-extrabold tracking-wider">STEP 2</span>
                    <h5 className="text-xs font-bold text-white pr-8">Mini Projects</h5>
                    <p className="text-[11px] text-slate-500 mt-1">Build sample systems integrating relational tables.</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-white/5 rounded-xl relative shadow-md">
                    <span className="absolute top-2 right-2.5 text-[10px] text-purple-500 font-extrabold tracking-wider">STEP 3</span>
                    <h5 className="text-xs font-bold text-white pr-8">Portfolios</h5>
                    <p className="text-[11px] text-slate-500 mt-1">Deploy real applications in production cloud logs.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
export default CareerRoadmap;
