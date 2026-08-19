import React, { useEffect, useState } from "react"
import api from "../services/api"
import { 
  GraduationCap, Search, ExternalLink, Star, CheckCircle, Clock, BookOpen, Loader2
} from "lucide-react"

export const LearningPath: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [skillSearch, setSkillSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")

  const loadLearningData = async () => {
    setLoading(true)
    try {
      // 1. Fetch courses recommendations
      const params: any = {}
      if (skillSearch) params.skill = skillSearch
      if (platformFilter) params.platform = platformFilter
      const courseRes = await api.get("/courses/recommend", { params })
      setCourses(courseRes.data)

      // 2. Fetch user progress
      const progressRes = await api.get("/courses/progress")
      setProgress(progressRes.data)
    } catch (err) {
      console.error("Failed to load learning paths", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLearningData()
  }, [platformFilter])

  const handleUpdateProgress = async (courseId: number, status: string, percent: number) => {
    try {
      await api.post(`/courses/${courseId}/progress`, {
        status,
        progress_percentage: percent
      })
      // Reload lists
      const progressRes = await api.get("/courses/progress")
      setProgress(progressRes.data)
    } catch (err) {
      alert("Failed to update learning progress.")
    }
  }

  const getCourseProgress = (courseId: number) => {
    const item = progress.find((p) => p.course_id === courseId)
    return item ? item : { status: "not_started", progress_percentage: 0 }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            Learning Paths & Academy
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access Coursera, Udemy, and YouTube lessons matching your target gaps.
          </p>
        </div>

        {/* Search form */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search by skill (e.g. Docker)..."
              className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-neonPurple"
            />
          </div>
          <button
            onClick={loadLearningData}
            className="px-4 py-2 bg-neonPurple text-white font-bold rounded-xl text-xs hover:bg-neonPurple/90 transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex space-x-2 border-b border-glassBorder pb-3">
        {["", "coursera", "udemy", "youtube"].map((plat) => (
          <button
            key={plat}
            onClick={() => setPlatformFilter(plat)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              platformFilter === plat
                ? "bg-neonPurple/20 border border-neonPurple text-white"
                : "bg-slate-900/40 text-slate-400 border border-transparent hover:text-white"
            }`}
          >
            {plat === "" ? "All Platforms" : plat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-neonPurple">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2 font-bold">Assembling course catalog...</span>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const userProg = getCourseProgress(course.id)
            return (
              <div
                key={course.id}
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-neonPurple/30 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-neonPurple/15 text-neonPurple border border-neonPurple/20 rounded uppercase">
                      {course.platform}
                    </span>
                    <span className="flex items-center text-xs font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                      {course.rating}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{course.title}</h3>
                  <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {course.skills_taught?.map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[9px] bg-slate-950 text-slate-400 border border-glassBorder rounded font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress bar and apply link */}
                <div className="pt-3 border-t border-glassBorder space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase">
                    <span>Course Status: {userProg.status.replace("_", " ")}</span>
                    <span>{userProg.progress_percentage}%</span>
                  </div>
                  
                  {/* Progress Bar Track */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-neonPurple h-full transition-all duration-500"
                      style={{ width: `${userProg.progress_percentage}%` }}
                    ></div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-between gap-3 pt-1">
                    <div className="flex space-x-1.5">
                      {userProg.status !== "completed" ? (
                        <>
                          <button
                            onClick={() => handleUpdateProgress(course.id, "in_progress", 50)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 rounded border border-glassBorder"
                          >
                            Set Active
                          </button>
                          <button
                            onClick={() => handleUpdateProgress(course.id, "completed", 100)}
                            className="px-2.5 py-1 bg-neonGreen/10 hover:bg-neonGreen/20 text-[10px] font-bold text-neonGreen rounded border border-neonGreen/20"
                          >
                            Mark Done
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-neonGreen font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Complete
                        </span>
                      )}
                    </div>

                    <a
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-neonCyan hover:underline flex items-center font-bold"
                    >
                      <span>Attend Lesson</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-xs">
          No learning paths found matching selected metrics. Try resetting searches.
        </div>
      )}
    </div>
  )
}
