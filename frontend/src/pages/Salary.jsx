import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  BadgeDollarSign, Info, ShieldCheck, Sparkles, Loader2, ArrowUpRight
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
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

export const Salary = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/salary-analysis")
        // Merge & validate response structure
        const validated = {
          role: "AI Engineer",
          min_salary: 0,
          max_salary: 0,
          confidence: 0.85,
          ranges: {
            entry: "Not Available",
            mid: "Not Available",
            senior: "Not Available"
          },
          factors: [],
          ...res.data
        }
        setData(validated)
      } catch (err) {
        console.error("Salary API failed, falling back to default configuration", err)
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
        <span>Synthesizing Market Compensation Intelligence...</span>
      </div>
    )
  }

  const fallback = {
    role: "AI Engineer",
    min_salary: 0,
    max_salary: 0,
    confidence: 0.85,
    ranges: {
      entry: "Not Available",
      mid: "Not Available",
      senior: "Not Available"
    },
    factors: []
  }

  const activeData = data || fallback

  const minSalary = safeNum(activeData.min_salary)
  const maxSalary = safeNum(activeData.max_salary)
  const avgSalary = (minSalary + maxSalary) / 2
  const confidence = safeNum(activeData.confidence)

  // Prep data for comparing market tiers in Recharts
  const chartData = [
    { name: "Entry Level", min: 6, max: 10, avg: 8 },
    { name: "Your Match", min: minSalary, max: maxSalary, avg: avgSalary },
    { name: "Mid Level", min: 12, max: 20, avg: 16 },
    { name: "Senior Level", min: 25, max: 40, avg: 32 }
  ]

  const factorsList = Array.isArray(activeData.factors) ? activeData.factors : []

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <BadgeDollarSign className="w-6 h-6 text-purple-500" />
            Compensation Insights & Salary Forecast
          </h1>
          <p className="text-sm text-slate-400">AI-calculated annual package ranges for target: <span className="text-white font-bold">{activeData.role || "AI Engineer"}</span></p>
        </div>
        <div className="px-5 py-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold rounded-xl flex items-center gap-2 w-fit shadow-md">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Confidence: {confidence * 100}%</span>
        </div>
      </div>

      {/* Target Salary Display Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Predicted Target Range</span>
            <h2 className="text-3xl font-black text-white">
              ₹{minSalary}L - ₹{maxSalary}L
            </h2>
            <p className="text-xs text-slate-400 mt-1">Average target: <span className="text-purple-400 font-bold">₹{avgSalary.toFixed(1)} LPA</span></p>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex justify-between text-xs text-slate-455 font-bold uppercase tracking-wider">
              <span>Market Baseline (India)</span>
              <span>LPA Currency</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white">
              <span>National Average (Mid)</span>
              <span className="text-cyan-400">₹14.5 LPA</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Salary Range Comparison Matrix</h3>
            <span className="text-xs text-slate-400">Values in LPA</span>
          </div>

          <div className="w-full h-56 flex items-center justify-center">
            {minSalary === 0 && maxSalary === 0 ? (
              <div className="text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-2 h-full border border-white/5 bg-slate-950/20 rounded-xl w-full py-16">
                <BadgeDollarSign className="w-8 h-8 text-slate-650" />
                <span>No profile salary coordinates available to plot comparison.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)", fontSize: 11 }} />
                  <Bar dataKey="avg" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === "Your Match" ? "#06b6d4" : "#8b5cf6"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Salary factors and India market benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Benchmarks */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            India Market Benchmarks
          </h3>

          <div className="space-y-4 pt-1">
            <div className="flex justify-between items-center p-3.5 bg-slate-950/60 border border-white/5 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white">Entry Level Tier</p>
                <p className="text-xs text-slate-500 mt-0.5">0-2 Years experience</p>
              </div>
              <span className="text-sm font-extrabold text-slate-300">{activeData.ranges?.entry || "Not Available"}</span>
            </div>
            
            <div className="flex justify-between items-center p-3.5 bg-slate-950/60 border border-white/5 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white">Mid Level Tier</p>
                <p className="text-xs text-slate-500 mt-0.5">2-5 Years experience</p>
              </div>
              <span className="text-sm font-extrabold text-cyan-400">{activeData.ranges?.mid || "Not Available"}</span>
            </div>

            <div className="flex justify-between items-center p-3.5 bg-slate-950/60 border border-white/5 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white">Senior Level Tier</p>
                <p className="text-xs text-slate-500 mt-0.5">5+ Years experience</p>
              </div>
              <span className="text-sm font-extrabold text-purple-400">{activeData.ranges?.senior || "Not Available"}</span>
            </div>
          </div>
        </div>

        {/* Factors */}
        <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            AI Calculation Factors
          </h3>

          <div className="space-y-4 pt-1">
            {factorsList.map((factor, idx) => (
              <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                <span className="text-sm text-slate-300 font-semibold">{factor?.name || "Factor"}</span>
                <span className="px-3.5 py-1 text-xs font-bold bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg">
                  {factor?.weight || "None"} Impact
                </span>
              </div>
            ))}
            {factorsList.length === 0 && (
              <p className="text-xs text-slate-500 italic">No estimation factor details calculated.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
export default Salary;
