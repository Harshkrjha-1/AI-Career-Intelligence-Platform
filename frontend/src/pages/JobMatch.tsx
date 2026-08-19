import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  Briefcase, Search, MapPin, DollarSign, CheckCircle2, AlertTriangle, ExternalLink, Loader2, Filter
} from "lucide-react"

export const JobMatch: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [location, setLocation] = useState("")
  const [salaryMin, setSalaryMin] = useState<number | "">("")
  const [expMax, setExpMax] = useState<number | "">("")

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (location) params.location = location
      if (salaryMin) params.salary_min = salaryMin
      if (expMax !== "") params.experience_max = expMax
      
      const res = await api.get("/jobs/recommend", { params })
      setJobs(res.data)
    } catch (err) {
      console.error("Failed to load job matches", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          AI-Powered Job Recommendations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore job postings automatically matching your experience levels and skills portfolio.
        </p>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-neonPurple" />
          Filter Vector Coordinates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Location Filter</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, San Francisco"
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-neonPurple"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Min Salary ($)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="e.g. 90000"
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-neonPurple"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Max Experience (Years)</label>
            <input
              type="number"
              value={expMax}
              onChange={(e) => setExpMax(e.target.value !== "" ? parseFloat(e.target.value) : "")}
              placeholder="e.g. 3"
              className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchJobs}
              className="w-full py-2.5 rounded-xl font-bold bg-neonPurple hover:bg-neonPurple/90 text-white transition-all text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-neonPurple/10"
            >
              <Search className="w-4 h-4" />
              <span>Query Positions</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-neonPurple">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2 font-bold">Scanning candidate compatibility...</span>
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row justify-between gap-6 glass-panel-hover"
            >
              {/* Job Info */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{job.title}</h3>
                    <p className="text-xs text-neonCyan font-semibold uppercase mt-0.5">{job.company}</p>
                  </div>
                  
                  {/* Match score label */}
                  <span className="lg:hidden text-xs font-black text-neonPurple bg-neonPurple/10 px-3 py-1 rounded-full border border-neonPurple/20">
                    {job.match_score}% Match
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-normal max-w-2xl">{job.description}</p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-neonCyan mr-1" />
                    {job.location || "Remote"}
                  </span>
                  {job.salary_min && (
                    <span className="flex items-center">
                      <DollarSign className="w-3.5 h-3.5 text-neonGreen mr-0.5" />
                      {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Briefcase className="w-3.5 h-3.5 text-neonPurple mr-1" />
                    Required Exp: {job.experience_required} years
                  </span>
                </div>

                {/* Skills tags lists */}
                {job.skills_required?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Target Technologies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills_required.map((sk: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] bg-slate-900 border border-glassBorder text-slate-300 rounded font-semibold"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Match Score Gauge & Apply Button */}
              <div className="w-full lg:w-48 flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:border-l border-glassBorder lg:pl-6">
                <div className="hidden lg:flex flex-col items-center text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Match Score
                  </div>
                  <div className="text-4xl font-black text-neonPurple text-neon-glow mt-1.5">
                    {job.match_score}%
                  </div>
                </div>

                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 rounded-xl font-bold bg-glassButton text-white hover:bg-slate-800 transition-all text-xs flex items-center justify-center space-x-1.5 border border-glassBorder w-full lg:w-auto"
                >
                  <span>Apply on LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-xs">
          No job roles matched matching criteria. Try clearing filters or refining terms.
        </div>
      )}
    </div>
  )
}
