import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  Compass, CheckCircle2, AlertTriangle, Play, Loader2, ArrowRight, BookOpen, Clock, BarChart
} from "lucide-react"

export const SkillGap: React.FC = () => {
  const [targetJob, setTargetJob] = useState("Full Stack Engineer")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)

  const fetchGapAnalysis = async () => {
    setLoading(true)
    try {
      const res = await api.get("/skills/gap-analysis", {
        params: { target_job: targetJob }
      })
      setData(res.data)
    } catch (err) {
      console.error("Gap analysis failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGapAnalysis()
  }, [targetJob])

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            Skill Gap & Roadmap Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Evaluate skill match percentages against target market jobs and generate dynamic roadmaps.
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-400">Target Role:</span>
          <select
            value={targetJob}
            onChange={(e) => setTargetJob(e.target.value)}
            className="bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-neonPurple"
          >
            <option value="Full Stack Engineer">Full Stack Engineer</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="AI/ML Engineer">AI/ML Engineer</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
            <option value="Product Manager">Product Manager</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-neonPurple">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2 font-bold">Computing skills delta...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Match Score Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-neonPurple/10 text-neonPurple border border-neonPurple/20 rounded-2xl">
                <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Target Job Comparison</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Analyzing profile skills matching score for: <span className="text-neonCyan font-bold">{data.target_job}</span>
                </p>
              </div>
            </div>

            {/* Score Ring indicator */}
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-neonPurple transition-all duration-1000"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={213}
                    strokeDashoffset={213 - (213 * data.match_percentage) / 100}
                  />
                </svg>
                <span className="absolute text-sm font-black text-white">{data.match_percentage}%</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Match Percentage</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal max-w-[150px]">
                  Higher scores increase recruiter visibility and interview invites.
                </p>
              </div>
            </div>
          </div>

          {/* Matching vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Matching */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-neonGreen uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Matching Competencies ({data.matching_skills?.length || 0})
              </h4>
              
              {data.matching_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.matching_skills.map((sk: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-semibold bg-neonGreen/10 text-neonGreen border border-neonGreen/20 rounded-full"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">None detected. Update profile core competencies.</p>
              )}
            </div>

            {/* Missing */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-neonPink uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Key Missing Skills ({data.missing_skills?.length || 0})
              </h4>

              {data.missing_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.missing_skills.map((sk: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-semibold bg-neonPink/10 text-neonPink border border-neonPink/20 rounded-full"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No missing skills detected! Profile matches perfectly.</p>
              )}
            </div>

          </div>

          {/* Learning Roadmap timeline */}
          {data.learning_roadmap?.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neonPurple" />
                  Structured Learning Curriculum
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Follow this chronological roadmap to close skill gaps and master target technologies.
                </p>
              </div>

              {/* Roadmap Steps */}
              <div className="relative pl-6 border-l border-glassBorder space-y-8 mt-4 ml-3">
                {data.learning_roadmap.map((step: any) => (
                  <div key={step.step} className="relative group">
                    
                    {/* Circle Node */}
                    <div className="absolute -left-[35px] top-1.5 bg-slate-900 border-2 border-neonPurple w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white group-hover:scale-110 transition-transform">
                      {step.step}
                    </div>

                    <div className="p-4 bg-slate-950/40 border border-glassBorder hover:border-neonPurple/40 rounded-xl transition-all space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{step.skill} Mastery</h4>
                          <div className="flex items-center space-x-3 mt-1.5">
                            <span className="flex items-center text-[10px] text-slate-400">
                              <Clock className="w-3 h-3 text-neonCyan mr-1" />
                              {step.duration}
                            </span>
                            <span className="flex items-center text-[10px] text-slate-400">
                              <BarChart className="w-3 h-3 text-neonPurple mr-1" />
                              Difficulty: {step.difficulty}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] px-2.5 py-0.5 bg-slate-900 border border-glassBorder text-slate-300 rounded font-semibold uppercase">
                          {step.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Course syllabus checkmarks */}
                      <div className="space-y-1.5 pl-2">
                        {step.topics?.map((topic: string, i: number) => (
                          <div key={i} className="flex items-center text-[11px] text-slate-500">
                            <span className="w-1 h-1 bg-neonPurple rounded-full mr-2"></span>
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-xs">
          Select a target job and fetch coordinates to display gap analysis dashboards.
        </div>
      )}
    </div>
  )
}
