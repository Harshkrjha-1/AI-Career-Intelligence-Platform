import React, { useEffect, useState } from "react"
import { DragDropUpload } from "../components/DragDropUpload"
import api from "../services/api"
import { 
  FileText, CheckCircle2, ChevronRight, HelpCircle, Loader2, Star, History, Sparkles, TrendingUp
} from "lucide-react"

export const ResumeUpload: React.FC = () => {
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  
  // Evaluation States
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<any | null>(null)
  const [targetRole, setTargetRole] = useState("Software Engineer")

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const res = await api.get("/resume/history")
      setHistory(res.data)
      if (res.data.length > 0 && !selectedResumeId) {
        // Auto select newest
        setSelectedResumeId(res.data[0].id)
      }
    } catch (err) {
      console.error("Failed to load resume history", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const triggerEvaluation = async (resumeId: number) => {
    setEvaluating(true)
    try {
      const res = await api.post("/resume/evaluate", null, {
        params: { resume_id: resumeId, target_role: targetRole }
      })
      setEvaluation(res.data)
    } catch (err) {
      console.error("Evaluation failed", err)
    } finally {
      setEvaluating(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    if (selectedResumeId) {
      triggerEvaluation(selectedResumeId)
    }
  }, [selectedResumeId, targetRole])

  const handleUploadSuccess = async (parsedData: any) => {
    // Re-fetch uploads
    await fetchHistory()
    if (parsedData?.resume_id) {
      setSelectedResumeId(parsedData.resume_id)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          Resume ATS Optimization
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload PDF or DOCX formats to parse skills, estimate ATS compliance and receive styling improvements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Uploader & Scores */}
        <div className="lg:col-span-2 space-y-6">
          <DragDropUpload onUploadSuccess={handleUploadSuccess} />

          {selectedResumeId && (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neonPurple" />
                    AI ATS Evaluation Report
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Analyzing selected version against keyword models.
                  </p>
                </div>
                
                {/* Target Role Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-400">Target Role:</span>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="AI/ML Engineer">AI/ML Engineer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Product Manager">Product Manager</option>
                  </select>
                </div>
              </div>

              {evaluating ? (
                <div className="h-48 flex items-center justify-center text-neonPurple">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2 font-semibold">Running ATS Scorer models...</span>
                </div>
              ) : evaluation ? (
                <div className="space-y-6">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950/60 border border-glassBorder rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Overall Score</p>
                      <p className="text-3xl font-black text-neonPurple mt-1">{evaluation.score}/100</p>
                    </div>
                    <div className="p-4 bg-slate-950/60 border border-glassBorder rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">ATS Match</p>
                      <p className="text-3xl font-black text-neonCyan mt-1">{evaluation.ats_compatibility}%</p>
                    </div>
                    <div className="p-4 bg-slate-950/60 border border-glassBorder rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Grammar Rating</p>
                      <p className="text-3xl font-black text-neonGreen mt-1">{evaluation.grammar_score}%</p>
                    </div>
                    <div className="p-4 bg-slate-950/60 border border-glassBorder rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Bullet Impact</p>
                      <p className="text-3xl font-black text-amber-400 mt-1">{evaluation.bullet_points_score}%</p>
                    </div>
                  </div>

                  {/* Feedback Bullets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Key Findings</h4>
                    <ul className="space-y-2">
                      {evaluation.feedback?.map((fb: string, i: number) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-neonGreen flex-shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Keywords */}
                  {evaluation.missing_keywords?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide text-neonPink">
                        Detected Missing Keywords (Important for ATS)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.missing_keywords.map((kw: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs font-semibold bg-neonPink/10 text-neonPink border border-neonPink/20 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Actionable Improvements
                    </h4>
                    <div className="space-y-2">
                      {evaluation.improvement_suggestions?.map((sug: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-900/40 border border-glassBorder rounded-xl flex items-start space-x-3">
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-neonPurple/15 text-neonPurple border border-neonPurple/20 rounded uppercase">
                            {sug.section}
                          </span>
                          <p className="text-xs text-slate-400 leading-normal">{sug.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Upload a resume or select a version to run AI evaluations.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Version History */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col h-[600px] overflow-hidden">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-neonPurple" />
            Resume Version History
          </h3>

          {loadingHistory ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-neonPurple mr-2" />
              <span>Fetching history logs...</span>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {history.map((res) => (
                <div
                  key={res.id}
                  onClick={() => setSelectedResumeId(res.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedResumeId === res.id
                      ? "bg-neonPurple/10 border-neonPurple text-white"
                      : "bg-slate-950/40 border-glassBorder text-slate-400 hover:border-neonPurple/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 flex-shrink-0" />
                      <div className="truncate max-w-[140px]">
                        <h4 className="text-xs font-bold text-white truncate">{res.file_name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Uploaded: {new Date(res.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-glassBorder text-slate-300 rounded font-semibold">
                      v{res.version}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs flex-1">
              No resumes uploaded yet. Drag & drop a PDF to create the first version entry.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
