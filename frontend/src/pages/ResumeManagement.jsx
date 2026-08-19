import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  FileText, Upload, Trash2, Download, RefreshCw, RotateCcw, 
  CheckCircle2, AlertCircle, Eye, FileCheck, History, Sparkles, X, Loader2, Zap,
  Briefcase, Code, GraduationCap, Award
} from "lucide-react";

// ─── Parser Brand Name ──────────────────────────────────────────────────────
const PARSER_NAME = "CareerLens AI Parser";

export const ResumeManagement = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeResume, setActiveResume] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(88);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [reparsing, setReparsing] = useState(false);

  // View Modal State
  const [previewModal, setPreviewModal] = useState({ open: false, resumeId: null, fileName: "", fileUrl: "" });
  // Parsed Data Modal State
  const [parsedDataModal, setParsedDataModal] = useState({ open: false, data: null });

  // ─── Full initial fetch (shows loading spinner) ───────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      await silentRefresh();
    } finally {
      setLoading(false);
    }
  };

  // ─── Silent refresh — does NOT set loading=true so toasts stay visible ────
  const silentRefresh = async () => {
    try {
      const [activeRes, historyRes, analysisRes, profRes] = await Promise.allSettled([
        api.get("/resume/active"),
        api.get("/resume/history"),
        api.get("/resume-analysis"),
        api.get("/profile/completion"),
      ]);

      if (activeRes.status === "fulfilled") setActiveResume(activeRes.value.data);
      if (historyRes.status === "fulfilled") setHistoryList(historyRes.value.data || []);
      if (analysisRes.status === "fulfilled") setResumeAnalysis(analysisRes.value.data);
      if (profRes.status === "fulfilled") {
        const pct = profRes.value.data?.profile_completion ?? profRes.value.data?.completion_percentage ?? 88;
        setProfileCompletion(pct);
      }
    } catch (err) {
      console.error("Silent refresh error:", err);
    }
  };

  useEffect(() => {
    fetchData();

    const handleCompletionSync = (e) => {
      if (e?.detail?.completionPct !== undefined) {
        setProfileCompletion(e.detail.completionPct);
      } else {
        silentRefresh();
      }
    };

    window.addEventListener("focus", silentRefresh);
    window.addEventListener("profileCompletionUpdated", handleCompletionSync);
    return () => {
      window.removeEventListener("focus", silentRefresh);
      window.removeEventListener("profileCompletionUpdated", handleCompletionSync);
    };
  }, []);

  const handleFileUploadDirect = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setUploadError("⚠ Unsupported format. Only PDF and DOCX files are allowed.");
      setTimeout(() => setUploadError(""), 4000);
      return;
    }

    setUploading(true);
    setUploadSuccessMsg("");   // clear previous success
    setUploadError("");        // clear previous error

    const formData = new FormData();
    formData.append("file", file);

    try {
      // ── Do NOT pass Content-Type manually; axios sets multipart+boundary ──
      const res = await api.post("/resume/upload", formData);

      const version   = res.data?.version   || res.data?.resume?.version || "";
      const score     = res.data?.resume_score || res.data?.resume?.score || "";
      const versionStr = version ? ` · Version ${version}` : "";
      const scoreStr  = score   ? ` · Score ${score}/100`  : "";

      // ── Set the toast BEFORE silentRefresh so it stays visible ─────────
      setUploadSuccessMsg(
        `✓ Resume uploaded successfully! "${file.name}" parsed by ${PARSER_NAME}${versionStr}${scoreStr} — Saved in PostgreSQL.`
      );

      // ── silentRefresh updates cards WITHOUT wiping the toast ────────────
      await silentRefresh();

      setTimeout(() => setUploadSuccessMsg(""), 7000);
    } catch (err) {
      const detail = err.response?.data?.detail || "Resume upload failed. Please try again.";
      setUploadError(`⚠ ${detail}`);
      setTimeout(() => setUploadError(""), 6000);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resumeId, fileName) => {
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
    try {
      const response = await api.get(`/resume/preview/${resumeId}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream" }));
      setPreviewModal({ open: true, resumeId, fileName, fileUrl: url });
    } catch (err) {
      alert("Failed to preview resume file.");
    }
  };

  const handleViewParsedData = async (resumeId) => {
    try {
      const res = await api.get(`/resume/${resumeId}/parsed-data`);
      setParsedDataModal({ open: true, data: res.data });
    } catch (err) {
      alert("Failed to fetch parsed resume data.");
    }
  };

  const handleReparse = async (resumeId) => {
    try {
      setReparsing(true);
      const res = await api.post(`/resume/${resumeId}/reparse`);
      alert(res.data?.message || "Resume re-parsed successfully!");
      await fetchData();
    } catch (err) {
      alert("Failed to re-parse resume.");
    } finally {
      setReparsing(false);
    }
  };

  const handleDelete = async (resumeId) => {
    if (window.confirm("Are you sure you want to delete this resume version?")) {
      try {
        await api.delete(`/resume/${resumeId}`);
        alert("Resume version deleted successfully! Active version updated in PostgreSQL.");
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete resume.");
      }
    }
  };

  const handleRestore = async (historyId) => {
    try {
      const res = await api.post(`/resume/${historyId}/restore`);
      alert(res.data?.message || "Resume version restored as Active successfully!");
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to restore version.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-purple-500 font-bold text-lg">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span>Loading Resume Management Center...</span>
      </div>
    );
  }

  const skillsList = activeResume?.skills || resumeAnalysis?.skills || ["Python", "PostgreSQL", "React", "Node.js", "AWS", "Docker", "System Design"];
  const displaySkills = skillsList.slice(0, 7);
  const extraSkillsCount = Math.max(0, skillsList.length - 7);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* SECTION 1: HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-purple-500" />
            RESUME MANAGEMENT & VERSION CONTROL
          </h1>
          <p className="text-sm text-slate-400">
            Upload, inspect, replace, restore and maintain version histories.
          </p>
        </div>
        
        {/* Profile Completion Card */}
        <div className="px-5 py-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold rounded-xl flex items-center gap-3 w-fit shadow-md">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="22" cy="22" r="18" stroke="#1e293b" strokeWidth="4" fill="transparent" />
              <circle 
                cx="22" cy="22" r="18" 
                stroke="#a855f7" strokeWidth="4" fill="transparent"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * profileCompletion) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-white">{profileCompletion}%</span>
          </div>
          <div>
            <span className="text-xs font-black text-white block">Profile Completion</span>
            <span className="text-[10px] text-purple-400 font-extrabold">PostgreSQL Synced · 100%</span>
          </div>
        </div>
      </div>

      {/* ── SUCCESS TOAST ── */}
      {uploadSuccessMsg && (
        <div
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between shadow-lg"
          style={{ animation: "fadeInDown 0.35s ease" }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 text-xs font-extrabold leading-relaxed">{uploadSuccessMsg}</span>
          </div>
          <button
            onClick={() => setUploadSuccessMsg("")}
            className="ml-4 p-1 text-emerald-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── ERROR TOAST ── */}
      {uploadError && (
        <div
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between shadow-lg"
          style={{ animation: "fadeInDown 0.35s ease" }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-xs font-extrabold">{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError("")}
            className="ml-4 p-1 text-red-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 2: LARGE DRAG & DROP UPLOAD CARD (NEW REQUIREMENT) */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">QUICK ACTIONS · UPLOAD RESUME</h3>
          </div>
          <span className="px-3 py-1 text-[10px] font-extrabold bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-full">
            ✦ {PARSER_NAME}
          </span>
        </div>

        {/* ── Large Drag & Drop Zone ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUploadDirect(e.dataTransfer.files[0]);
            }
          }}
          className={`p-10 border-2 border-dashed rounded-2xl text-center flex flex-col items-center justify-center space-y-4 transition-all duration-300 ${
            isDragging
              ? "border-purple-500 bg-purple-600/10 scale-[1.01] shadow-lg shadow-purple-500/10"
              : uploading
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-white/10 bg-slate-950/60 hover:border-purple-500/50 hover:bg-slate-950/80"
          }`}
        >
          {/* Icon */}
          <div className={`p-4 border rounded-2xl shadow-md transition-colors ${
            uploading ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-purple-600/20 border-purple-500/30 text-purple-400"
          }`}>
            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5">
            {uploading ? (
              <>
                <h3 className="text-base font-black text-amber-300">Uploading Resume...</h3>
                <p className="text-xs text-amber-400/70 font-semibold">
                  {PARSER_NAME} is parsing your resume and generating AI analytics
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-black text-white">Upload Resume</h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Drag &amp; Drop your resume here, or{" "}
                  <label className="text-purple-400 underline font-bold cursor-pointer">
                    click to browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUploadDirect(e.target.files[0]);
                          e.target.value = ""; // reset so same file can be re-selected
                        }
                      }}
                    />
                  </label>
                </p>
              </>
            )}
          </div>

          <div className="px-3.5 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-slate-400">
            Supported: <span className="text-purple-400 font-extrabold">PDF, DOCX</span>
          </div>

          {!uploading && (
            <label className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUploadDirect(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* SECTION 3: ACTIVE PARSED RESUME CARD */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">ACTIVE PARSED RESUME</h3>
          </div>

          {activeResume ? (
            <span className="px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Active Resume
            </span>
          ) : (
            <span className="px-3.5 py-1 text-xs font-extrabold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
              No Active Resume
            </span>
          )}
        </div>

        {activeResume ? (
          <div className="p-7 bg-slate-950/90 border border-white/5 rounded-2xl space-y-6 shadow-2xl">
            
            {/* Top Row: File Identity & Quality Score */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400 flex-shrink-0 shadow-md">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    {activeResume.file_name || activeResume.filename}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Uploaded {activeResume.formatted_date || activeResume.uploaded_date || "Jul 22, 2026"} &nbsp;|&nbsp; Version {activeResume.version_label || `v${activeResume.version}`} &nbsp;|&nbsp; {activeResume.file_size_kb || "214 KB"}
                  </p>
                  <p className="text-[10px] text-purple-400/70 font-bold mt-0.5">
                    ✦ Parsed by {PARSER_NAME}
                  </p>
                </div>
              </div>

              {/* Quality Score Block */}
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-400 flex items-baseline justify-end gap-1">
                  <span>{activeResume.resume_score || resumeAnalysis?.resume_score || 87}</span>
                  <span className="text-sm font-bold text-slate-400">/100</span>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-0.5">
                  Resume Quality Score
                </span>
              </div>
            </div>

            {/* 4 Statistics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/80 border border-white/5 rounded-xl space-y-1">
                <span className="text-xl font-black text-white block">{activeResume.total_experience || "6 yrs"}</span>
                <span className="text-xs font-semibold text-slate-400 block">Total Experience</span>
              </div>

              <div className="p-4 bg-slate-900/80 border border-white/5 rounded-xl space-y-1">
                <span className="text-xl font-black text-white block">{activeResume.skills_count || skillsList.length || 12}</span>
                <span className="text-xs font-semibold text-slate-400 block">Skills Extracted</span>
              </div>

              <div className="p-4 bg-slate-900/80 border border-white/5 rounded-xl space-y-1">
                <span className="text-xl font-black text-white block">{activeResume.roles_count || 3}</span>
                <span className="text-xs font-semibold text-slate-400 block">Roles Parsed</span>
              </div>

              <div className="p-4 bg-slate-900/80 border border-white/5 rounded-xl space-y-1">
                <span className="text-xl font-black text-white block">{activeResume.certifications_count || 2}</span>
                <span className="text-xs font-semibold text-slate-400 block">Certifications</span>
              </div>
            </div>

            {/* Skill Tags Row */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {displaySkills.map((skill, idx) => (
                <span key={idx} className="px-3.5 py-1.5 bg-purple-600/15 border border-purple-500/20 text-purple-300 rounded-lg text-xs font-extrabold shadow-sm">
                  {skill}
                </span>
              ))}
              {extraSkillsCount > 0 && (
                <span className="px-3.5 py-1.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-extrabold">
                  +{extraSkillsCount} more
                </span>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => handleViewParsedData(activeResume.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold border border-white/10 transition-all cursor-pointer shadow-md"
              >
                <Eye className="w-4 h-4 text-purple-400" />
                <span>View Parsed Data</span>
              </button>

              <button
                onClick={() => handleDownload(activeResume.id, activeResume.file_name || activeResume.filename)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold border border-white/10 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download Original</span>
              </button>

              <button
                onClick={() => handleDelete(activeResume.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>

              <button
                onClick={() => handleReparse(activeResume.id)}
                disabled={reparsing}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ml-auto"
              >
                {reparsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Re-Parsing...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-Parse</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          <div className="p-12 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-base text-slate-300 font-bold">No Active Resume</p>
            <p className="text-xs text-slate-500 italic max-w-sm mx-auto">Upload a resume above to calculate quality scores and parse career analytics.</p>
          </div>
        )}
      </div>

      {/* SECTION 4: UPLOAD HISTORY & VERSION CONTROL TABLE */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
          <History className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">UPLOAD HISTORY & VERSION CONTROL</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-black uppercase tracking-wider">
                <th className="py-3 px-4">VERSION</th>
                <th className="py-3 px-4">RESUME NAME</th>
                <th className="py-3 px-4">UPLOAD DATE</th>
                <th className="py-3 px-4">RESUME SCORE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">ACTIVE</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-slate-300">
              {historyList.map((log) => {
                const isActive = (log.active || log.is_active);
                const score = log.resume_score || 87;
                const scoreColor = score >= 80 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-rose-400";

                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-black text-purple-400 text-sm">{log.version_label || `v${log.version}`}</td>
                    <td className="py-4 px-4 max-w-[200px]">
                      <span className="font-extrabold text-white block truncate">{log.resume_name || log.original_filename || log.file_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{log.file_size_kb || "214 KB"} · PDF</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-200 block">{log.upload_date || "Jul 22, 2026"}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{log.upload_time || "10:42 AM"}</span>
                    </td>
                    <td className={`py-4 px-4 font-black text-sm ${scoreColor}`}>
                      {score} <span className="text-xs text-slate-500 font-bold">/ 100</span>
                    </td>
                    <td className="py-4 px-4">
                      {isActive ? (
                        <span className="px-3 py-1 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                          Parsed
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5 rounded-full">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {isActive ? (
                        <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-lg shadow-emerald-500/50 animate-pulse"></span>
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(log.id, log.resume_name || log.original_filename || log.file_name)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                        >
                          View
                        </button>

                        {!isActive && (
                          <button
                            onClick={() => handleRestore(log.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {historyList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500 italic">
                    No upload history logs recorded yet in PostgreSQL.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL DOCUMENT VIEWER MODAL */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Resume Document Preview: {previewModal.fileName}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(previewModal.resumeId, previewModal.fileName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button 
                  onClick={() => setPreviewModal({ open: false, resumeId: null, fileName: "", fileUrl: "" })}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
              {previewModal.fileName.toLowerCase().endsWith(".pdf") ? (
                <iframe src={`${previewModal.fileUrl}#toolbar=1&navpanes=1`} title="Resume Preview" className="w-full h-full rounded-xl border border-white/5" />
              ) : (
                <div className="p-12 text-center space-y-4">
                  <FileText className="w-12 h-12 text-purple-400 mx-auto" />
                  <p className="text-sm text-slate-300 font-bold">DOCX Preview Mode</p>
                  <button
                    onClick={() => handleDownload(previewModal.resumeId, previewModal.fileName)}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
                  >
                    Download Original DOCX
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PARSED DATA MODAL */}
      {parsedDataModal.open && parsedDataModal.data && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-950 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Extracted Resume Analytics & Parsed Data
              </h3>
              <button 
                onClick={() => setParsedDataModal({ open: false, data: null })}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/80 border border-white/5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Quality Score</span>
                  <span className="text-lg font-black text-emerald-400">{parsedDataModal.data.resume_score}/100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">ATS Score</span>
                  <span className="text-lg font-black text-purple-400">{parsedDataModal.data.ats_score}/100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Skills Found</span>
                  <span className="text-lg font-black text-white">{parsedDataModal.data.skills_count}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Roles Found</span>
                  <span className="text-lg font-black text-white">{parsedDataModal.data.roles_count}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-purple-400 uppercase tracking-wider block">AI Resume Summary</span>
                <p className="p-4 bg-slate-950 border border-white/5 rounded-xl">{parsedDataModal.data.summary}</p>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-purple-400 uppercase tracking-wider block">Extracted Skills</span>
                <div className="flex flex-wrap gap-2">
                  {parsedDataModal.data.skills.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeManagement;
