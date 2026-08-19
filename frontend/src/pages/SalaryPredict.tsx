import React, { useState } from "react"
import api from "../services/api"
import { 
  BadgeDollarSign, MapPin, Briefcase, TrendingUp, HelpCircle, Loader2, DollarSign
} from "lucide-react"

export const SalaryPredict: React.FC = () => {
  const [jobTitle, setJobTitle] = useState("Full Stack Engineer")
  const [location, setLocation] = useState("Remote")
  const [industry, setIndustry] = useState("E-commerce")
  const [experience, setExperience] = useState(2)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/salary/predict", {
        job_title: jobTitle,
        location,
        industry,
        experience_years: experience
      })
      setResult(res.data)
    } catch (err) {
      alert("Failed to compute salary predictions.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          Salary Predictor Model
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Predict market-average packages based on role parameters, locations, and industries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 h-fit">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
            <BadgeDollarSign className="w-4 h-4 text-neonPurple" />
            Parameter Coordinates
          </h3>

          <form onSubmit={handlePredict} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Job Title</label>
              <select
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Full Stack Engineer">Full Stack Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Location Index</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
              >
                <option value="Remote">Remote</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
                <option value="Seattle">Seattle</option>
                <option value="London">London</option>
                <option value="Berlin">Berlin</option>
                <option value="Toronto">Toronto</option>
                <option value="Bangalore">Bangalore</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Market Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
              >
                <option value="E-commerce">E-commerce</option>
                <option value="Fintech">Fintech</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Edtech">Edtech</option>
                <option value="Web3 / Blockchain">Web3 / Blockchain</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="AI / Deep Tech">AI / Deep Tech</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="30"
                value={experience}
                onChange={(e) => setExperience(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-neonPurple to-neonIndigo text-white hover:opacity-90 disabled:opacity-50 transition-all text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-neonPurple/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span>Predict Target Package</span>
            </button>
          </form>
        </div>

        {/* Right Columns: Output Display */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-center">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center text-neonPurple space-y-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold">Querying salary indexes...</span>
            </div>
          ) : result ? (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Predicted Annual Compensation
                </p>
                <div className="text-6xl font-black text-neonPurple text-neon-glow mt-2">
                  ${result.predicted_salary?.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Calculated based on {result.experience_years} years experience in {result.location} ({result.industry} sector).
                </p>
              </div>

              {/* Confidence Interval bar */}
              <div className="space-y-3 p-6 bg-slate-950/40 border border-glassBorder rounded-2xl">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Lower Limit: ${result.confidence_interval?.[0]?.toLocaleString()}</span>
                  <span>Confidence Interval (95%)</span>
                  <span>Upper Limit: ${result.confidence_interval?.[1]?.toLocaleString()}</span>
                </div>
                
                {/* Visual Bar Track */}
                <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="absolute left-[15%] right-[15%] h-full bg-gradient-to-r from-neonPurple to-neonCyan rounded-full"></div>
                  <div className="absolute left-[50%] -translate-x-[50%] top-[-2px] w-4.5 h-4.5 bg-white border-2 border-neonPurple rounded-full shadow-md shadow-neonPurple/50"></div>
                </div>

                <p className="text-[10px] text-slate-500 text-center leading-normal pt-2">
                  Our regression model maps target locations indexes and active skills variables against current recruiter packages.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <BadgeDollarSign className="w-12 h-12 text-slate-700" />
              <p>Configure candidate coordinates and click Predict to display compensation matrices.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
