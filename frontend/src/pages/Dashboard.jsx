import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import { 
  Sparkles, ShieldCheck, Mail, Phone, Compass, GraduationCap, Briefcase, 
  Upload, FileText, CheckCircle2, Loader2, AlertCircle, BarChart2, User,
  History, Settings, Zap, ArrowRight, Clock, FileCheck, Eye, Download, RefreshCw, Trash2
} from "lucide-react"
import { DashboardIntelligence } from "../components/DashboardIntelligence"

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
  recommendations: [],
  profile_completion: 88,
  latest_resume: {
    file_name: "No Active Resume",
    uploaded_at: "N/A",
    size_kb: 0
  },
  recent_activity: []
};

// Safe numeric sanitizer helper
const safeNum = (val) => {
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [data, setData] = useState(dashboardFallback)

  // View Modal State
  const [previewModal, setPreviewModal] = useState({ open: false, resumeId: null, fileName: "", fileUrl: "" });

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/dashboard")
      
      const validated = {
        ...dashboardFallback,
        ...res.data,
        user: {
          ...dashboardFallback.user,
          ...res.data?.user
        },
        salary_prediction: {
          ...dashboardFallback.salary_prediction,
          ...res.data?.salary_prediction,
          ...res.data?.salary
        }
      }
      setData(validated)
    } catch (err) {
      console.error("Dashboard API request failed, loading fallback metrics:", err)
      setData(dashboardFallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const handleCompletionSync = (e) => {
      if (e?.detail?.completionPct !== undefined) {
        setData(prev => ({ ...prev, profile_completion: e.detail.completionPct }))
      } else {
        fetchDashboardData()
      }
    }

    window.addEventListener("focus", fetchDashboardData)
    window.addEventListener("profileCompletionUpdated", handleCompletionSync)
    return () => {
      window.removeEventListener("focus", fetchDashboardData)
      window.removeEventListener("profileCompletionUpdated", handleCompletionSync)
    }
  }, [])

  const handleFileUpload = async (e, replaceId = null) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const ext = file.name.split(".").pop().toLowerCase()
      if (ext !== "pdf" && ext !== "docx") {
        alert("Unsupported format. Only PDF and DOCX files are allowed.")
        return
      }

      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      try {
        if (replaceId) {
          await api.put(`/api/resume/replace?resume_id=${replaceId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          })
          alert("Resume replaced successfully! New version created in PostgreSQL.")
        } else {
          const res = await api.post("/resume/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          })
          alert(res.data.message)
        }
        await fetchDashboardData()
        window.dispatchEvent(new CustomEvent("resumeUpdated"))
      } catch (err) {
        alert(err.response?.data?.detail || "Upload failed.")
      } finally {
        setUploading(false)
      }
    }
  }

  const handleDownload = async (resumeId, fileName) => {
    if (!resumeId) {
      alert("No active resume to download.");
      return;
    }
    try {
      const response = await api.get(`/resume/download/${resumeId}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "resume.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download resume file.");
    }
  };

  const handleView = async (resumeId, fileName) => {
    if (!resumeId) {
      alert("No active resume to view.");
      return;
    }
    try {
      const response = await api.get(`/resume/view/${resumeId}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: fileName.endsWith(".pdf") ? "application/pdf" : "application/octet-stream" }));
      setPreviewModal({ open: true, resumeId, fileName, fileUrl: url });
    } catch (err) {
      alert("Failed to preview resume file.");
    }
  };

  const handleDelete = async (resumeId) => {
    if (!resumeId) return;
    if (window.confirm("Are you sure you want to delete this resume version?")) {
      try {
        await api.delete(`/resume/${resumeId}`);
        alert("Resume version deleted successfully! Dashboard active status updated.");
        await fetchDashboardData();
        window.dispatchEvent(new CustomEvent("resumeUpdated"))
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete resume.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-purple-500 font-bold text-lg">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span>Loading Analytics Dashboard...</span>
      </div>
    )
  }

  const activeData = data || dashboardFallback

  const resumeScore = safeNum(activeData.resume_score)
  const overallReadiness = safeNum(activeData.readiness?.overall)
  const resumeReadiness = safeNum(activeData.readiness?.resume)
  const skillsReadiness = safeNum(activeData.readiness?.skills)
  const projectsReadiness = safeNum(activeData.readiness?.projects)
  const experienceReadiness = safeNum(activeData.readiness?.experience)

  const atsCompatibility = safeNum(activeData.ats_compatibility)
  const keywordMatch = safeNum(activeData.keyword_match)
  const formattingScore = safeNum(activeData.formatting_score)
  const experienceScore = safeNum(activeData.experience_score)
  const profileCompletion = safeNum(activeData.profile_completion) || 88

  const candidateName = activeData.profile_summary?.name || activeData.user?.name || activeData.user_name || "Candidate"
  const candidateRole = activeData.profile_summary?.role || activeData.salary_prediction?.role || "Not Available"
  const candidateEmail = activeData.profile_summary?.email || activeData.user?.email || "email@domain.com"
  const candidatePhone = activeData.profile_summary?.phone || "Not Available"

  const skillsList = Array.isArray(activeData.skills) ? activeData.skills : []

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-slate-900/40 border border-white/5 rounded-2xl shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-purple-500" />
            AI Career Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Hello, <span className="font-bold text-white">{candidateName}</span>. Your parsed resume profile is synchronized in PostgreSQL.
          </p>
        </div>
        
        <label className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer shadow-lg shadow-purple-600/15 transition-all">
          <Upload className="w-4 h-4" />
          <span>Upload Resume</span>
          <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Top Row Grid: Score Circular progress, Career Readiness Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Resume Score Card (6 Cols) */}
        <div className="lg:col-span-6 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-8 shadow-xl">
          {/* Circular progress display */}
          <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle
                cx="80"
                cy="80"
                r="68"
                stroke="#1e293b"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                stroke="url(#purpleGlow)"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray="427"
                strokeDashoffset={427 - (427 * resumeScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{resumeScore}</span>
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider mt-0.5">Quality Score</span>
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Resume Quality Score</h3>
              <p className="text-xs text-slate-400 mt-1">Real-time keyword density, formats, & parameters checks.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">ATS Compatibility</span>
                <span className="text-sm font-extrabold text-white">{atsCompatibility}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Keyword Match</span>
                <span className="text-sm font-extrabold text-white">{keywordMatch}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Formatting Score</span>
                <span className="text-sm font-extrabold text-white">{formattingScore}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Experience Score</span>
                <span className="text-sm font-extrabold text-white">{experienceScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Career Readiness Meter Card (6 Cols) */}
        <div className="lg:col-span-6 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Career Readiness Index</h3>
            <span className="px-3 py-1 text-xs font-bold bg-cyan-600/10 text-cyan-400 border border-cyan-500/25 rounded-md">
              {overallReadiness}% Ready
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Resume Audit Score</span>
                <span className="text-slate-200">{resumeReadiness}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${resumeReadiness}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Skills Matrix Mapping</span>
                <span className="text-slate-200">{skillsReadiness}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${skillsReadiness}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Projects Showcase Index</span>
                <span className="text-slate-200">{projectsReadiness}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${projectsReadiness}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Experience Match Density</span>
                <span className="text-slate-200">{experienceReadiness}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${experienceReadiness}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Extracted Info Card & File Uploader Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Extracted Profile Details UI (8 Cols) */}
        <div className="lg:col-span-8 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <User className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Resume Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            
            {/* Left box contact information (4 Cols) */}
            <div className="sm:col-span-4 space-y-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-white/5 space-y-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Metadata Vector</p>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">{candidateName}</h4>
                  <p className="text-xs text-purple-400 font-bold">{candidateRole}</p>
                </div>
                
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{candidateEmail}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Phone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{candidatePhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right box skills & history highlights (8 Cols) */}
            <div className="sm:col-span-8 space-y-5">
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">Core Extracted Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.slice(0, 15).map((sk, idx) => (
                    <span key={idx} className="px-3.5 py-1 text-xs font-bold bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-md">
                      {sk}
                    </span>
                  ))}
                  {skillsList.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No skills extracted. Upload resume to parse.</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">Education Profile Highlight</span>
                <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl">
                  <p className="text-xs font-bold text-white">🎓 B.Tech Artificial Intelligence & Machine Learning</p>
                  <p className="text-[11px] text-slate-400 mt-1">IIT Bombay — 2024</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Drag Drop parser upload card (4 Cols) */}
        <div className="lg:col-span-4 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload & Re-Parse Resume
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-3">
              Select or drop a new resume file. Our AI engine parses education timeline lists and technology frameworks within seconds.
            </p>
          </div>

          <label className="border-2 border-dashed border-white/10 hover:border-purple-500/40 hover:bg-slate-950/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200">
            <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <span className="text-xs font-bold text-white">Evaluating File Stream...</span>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 text-purple-500 mb-3" />
                <span className="text-xs font-bold text-white">Click to Select Resume</span>
                <span className="text-[10px] text-slate-500 mt-1">Supports PDF & DOCX</span>
              </>
            )}
          </label>
        </div>

      </div>

      {/* MILESTONE-2 WIDGETS BELOW */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        {/* Profile Completion Circular Widget (4 Cols) */}
        <div className="lg:col-span-4 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Profile Completion
            </h3>
            <span className="text-xs text-purple-400 font-bold">{profileCompletion}%</span>
          </div>

          <div className="flex items-center gap-6 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                <circle 
                  cx="56" cy="56" r="46" 
                  stroke="#a855f7" strokeWidth="10" fill="transparent"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (289 * profileCompletion) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{profileCompletion}%</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">Keep your profile parameters up to date for precise AI career scoring.</p>
              <Link to="/profile" className="inline-flex items-center gap-1.5 text-purple-400 font-bold hover:underline">
                <span>Update Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Latest Active Resume & Controls Card (4 Cols) */}
        <div className="lg:col-span-4 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Latest Active Resume
            </h3>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">
              {activeData.latest_resume?.id ? `Active v${activeData.latest_resume?.version || 1}` : "No Active Resume"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-950/80 border border-white/5 rounded-xl space-y-2">
              <p className="text-xs font-extrabold text-white flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="truncate">{activeData.latest_resume?.file_name || "No Active Resume"}</span>
              </p>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Uploaded: {activeData.latest_resume?.uploaded_at || "N/A"}</span>
                <span>Size: {activeData.latest_resume?.size_kb || 0} KB</span>
              </div>
            </div>

            {/* Interactive Action Buttons */}
            {activeData.latest_resume?.id ? (
              <div className="grid grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => handleView(activeData.latest_resume.id, activeData.latest_resume.file_name)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
                  title="View Resume"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => handleDownload(activeData.latest_resume.id, activeData.latest_resume.file_name)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
                  title="Download Resume"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download</span>
                </button>

                <label className="p-2 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Replace</span>
                  <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => handleFileUpload(e, activeData.latest_resume.id)} />
                </label>

                <button
                  onClick={() => handleDelete(activeData.latest_resume.id)}
                  className="p-2 bg-slate-950 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
                  title="Delete Resume"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            ) : (
              <Link to="/dashboard/resume-management" className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all">
                <span>Manage Resumes & Version Control</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions Grid (4 Cols) */}
        <div className="lg:col-span-4 p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link to="/profile" className="p-3 bg-slate-950/80 border border-white/5 rounded-xl font-bold text-slate-300 hover:text-white hover:border-purple-500/30 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>Edit Profile</span>
            </Link>

            <Link to="/dashboard/resume-management" className="p-3 bg-slate-950/80 border border-white/5 rounded-xl font-bold text-slate-300 hover:text-white hover:border-purple-500/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Resumes</span>
            </Link>

            <Link to="/dashboard/skill-gap" className="p-3 bg-slate-950/80 border border-white/5 rounded-xl font-bold text-slate-300 hover:text-white hover:border-purple-500/30 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Skill Gap</span>
            </Link>

            <Link to="/dashboard/settings" className="p-3 bg-slate-950/80 border border-white/5 rounded-xl font-bold text-slate-300 hover:text-white hover:border-purple-500/30 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

      </div>

      {/* APPENDED INTELLIGENCE SECTIONS (ATS, Skill Gap, Suggestions, Career Recs, Jobs, Courses) */}
      <DashboardIntelligence atsScore={atsCompatibility} />

      {/* FULL DOCUMENT VIEWER MODAL (MATCHING SCREENSHOT WITH TOOLBAR) */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Top Viewer Control Bar */}
            <div className="p-4 bg-slate-950 border-b border-white/10 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white truncate max-w-md">
                    {previewModal.fileName}
                  </h3>
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                    Interactive PDF Document Viewer
                  </span>
                </div>
              </div>

              {/* Action Toolbar: Download, Delete, Close */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(previewModal.resumeId, previewModal.fileName)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition-all"
                  title="Download File to Laptop"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    handleDelete(previewModal.resumeId);
                    setPreviewModal({ open: false, resumeId: null, fileName: "", fileUrl: "" });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                  title="Delete this version"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <button 
                  onClick={() => setPreviewModal({ open: false, resumeId: null, fileName: "", fileUrl: "" })}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                  title="Close Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden relative">
              {previewModal.fileName.toLowerCase().endsWith(".pdf") ? (
                <iframe 
                  src={`${previewModal.fileUrl}#toolbar=1&navpanes=1`} 
                  title="Interactive Resume Document Viewer" 
                  className="w-full h-full rounded-xl border border-white/5 bg-slate-900" 
                />
              ) : (
                <div className="p-12 text-center space-y-5 my-auto">
                  <FileText className="w-16 h-16 text-purple-400 mx-auto animate-bounce" />
                  <h4 className="text-base font-extrabold text-white">DOCX Document View Mode</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    This document was uploaded in Microsoft Word (.docx) format. Click below to download the exact original file directly to your laptop or view parsed text.
                  </p>
                  <button
                    onClick={() => handleDownload(previewModal.resumeId, previewModal.fileName)}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition-all"
                  >
                    Download Original DOCX
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
export default Dashboard;
