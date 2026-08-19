import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import {
  FileText, Download, Upload, ChevronRight, ChevronLeft,
  Plus, Trash2, CheckCircle2, AlertCircle, Loader2,
  Sparkles, Eye, Layout, Palette, User, Briefcase,
  GraduationCap, FileCheck, Clock, Database, X, Zap
} from "lucide-react";

// ─── ATS score calculator (runs client-side on every keystroke) ──────────────
const calcAtsScore = (draft) => {
  let score = 0;
  const checks = [];

  if (draft.name?.trim())       { score += 8;  checks.push({ ok: true,  label: "Name present" }); }
  else                          { checks.push({ ok: false, label: "Add your full name" }); }
  if (draft.email?.trim())      score += 6;
  if (draft.phone?.trim())      score += 6;

  if (draft.targetRole?.trim()) { score += 15; checks.push({ ok: true,  label: "Target role specified" }); }
  else                          { checks.push({ ok: false, label: "Add a target role / job title" }); }

  if ((draft.summary || "").length > 80) { score += 10; checks.push({ ok: true,  label: "Professional summary present" }); }
  else                                    { checks.push({ ok: false, label: "Write a 2-3 sentence summary" }); }

  const expText = (draft.experience || []).map(e => e.bullets || "").join(" ");
  const hasNumbers = /\d+/.test(expText);
  const expFilled = (draft.experience || []).filter(e => e.company && e.title).length > 0;
  if (expFilled)   { score += 15; checks.push({ ok: true,  label: "Work experience added" }); }
  else             { checks.push({ ok: false, label: "Add at least one work experience" }); }
  if (hasNumbers)  { score += 10; checks.push({ ok: true,  label: "Quantified metrics in experience" }); }
  else             { checks.push({ ok: false, label: "Add numbers/metrics to experience bullets" }); }

  const skills = (draft.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  if (skills.length >= 5)      { score += 15; checks.push({ ok: true,  label: `${skills.length} skills listed` }); }
  else if (skills.length > 0)  { score += 7;  checks.push({ ok: false, label: "List at least 5 skills" }); }
  else                         { checks.push({ ok: false, label: "Add skills (comma-separated)" }); }

  if ((draft.education || []).some(e => e.institution))
    { score += 10; checks.push({ ok: true,  label: "Education section filled" }); }
  else
    { checks.push({ ok: false, label: "Add education details" }); }

  if (draft.targetRole && skills.length > 0) {
    const roleWords = draft.targetRole.toLowerCase().split(/\s+/);
    const skillsLower = skills.map(s => s.toLowerCase());
    const overlap = roleWords.some(w => skillsLower.some(s => s.includes(w)));
    if (overlap) { score += 5; checks.push({ ok: true,  label: "Skills overlap with target role" }); }
    else         { checks.push({ ok: false, label: "Match skills to your target role keywords" }); }
  }

  return { score: Math.min(score, 100), checks };
};

const emptyDraft = () => ({
  name: "", email: "", phone: "", location: "",
  targetRole: "", linkedin: "", github: "",
  summary: "",
  experience: [{ id: Date.now(), title: "", company: "", duration: "", bullets: "" }],
  education: [{ id: Date.now() + 1, degree: "", institution: "", year: "" }],
  skills: "",
  certifications: "",
});

const relativeTime = (isoStr) => {
  if (!isoStr) return null;
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const STEPS = [
  { id: 0, label: "Personal Info",  icon: User },
  { id: 1, label: "Summary",        icon: FileText },
  { id: 2, label: "Experience",     icon: Briefcase },
  { id: 3, label: "Skills",         icon: Zap },
  { id: 4, label: "Education",      icon: GraduationCap },
];

const TEMPLATES = [
  { id: "modern",  label: "Modern"  },
  { id: "classic", label: "Classic" },
];

// ════════════════════════════════════════════════════════════════════════════════
//  LIVE PREVIEW
// ════════════════════════════════════════════════════════════════════════════════
const ResumePreview = React.forwardRef(({ draft, template }, ref) => {
  const isPurple = template === "modern";
  const accent   = isPurple ? "#7c3aed" : "#1e40af";
  const skills   = (draft.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const certs    = (draft.certifications || "").split(",").map(s => s.trim()).filter(Boolean);

  const headerStyle = isPurple
    ? { background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)", color: "#fff", padding: "28px 32px" }
    : { background: "#1e40af", color: "#fff", padding: "28px 32px", borderBottom: "4px solid #1e3a8a" };

  return (
    <div
      ref={ref}
      id="resume-preview-root"
      style={{
        fontFamily: isPurple ? "'Segoe UI',sans-serif" : "Georgia,'Times New Roman',serif",
        background: "#fff",
        color: "#1a1a2e",
        minHeight: "900px",
        fontSize: "12px",
        lineHeight: "1.5",
      }}
    >
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>{draft.name || "Your Name"}</h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", opacity: 0.9 }}>{draft.targetRole || "Target Role"}</p>
        <div style={{ marginTop: "10px", fontSize: "11px", opacity: 0.85, display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {draft.email    && <span>✉ {draft.email}</span>}
          {draft.phone    && <span>📞 {draft.phone}</span>}
          {draft.location && <span>📍 {draft.location}</span>}
          {draft.linkedin && <span>in {draft.linkedin}</span>}
          {draft.github   && <span>⌥ {draft.github}</span>}
        </div>
      </div>

      <div style={{ padding: "24px 32px", display: "flex", gap: "24px" }}>
        <div style={{ flex: isPurple ? "1 1 60%" : "1 1 100%" }}>
          {draft.summary && (
            <section style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "8px" }}>
                Professional Summary
              </h2>
              <p style={{ margin: 0, color: "#374151", fontSize: "11.5px" }}>{draft.summary}</p>
            </section>
          )}

          {(draft.experience || []).length > 0 && (
            <section style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "10px" }}>
                Work Experience
              </h2>
              {(draft.experience || []).map((exp, i) => (
                <div key={exp.id || i} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "12.5px", color: "#111827" }}>{exp.title || "Job Title"}</strong>
                    <span style={{ fontSize: "10.5px", color: "#6b7280" }}>{exp.duration}</span>
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "11px", marginBottom: "4px" }}>{exp.company}</div>
                  {exp.bullets && (
                    <ul style={{ margin: "4px 0 0 14px", padding: 0 }}>
                      {exp.bullets.split("\n").filter(Boolean).map((b, bi) => (
                        <li key={bi} style={{ color: "#374151", fontSize: "11px", marginBottom: "2px" }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {(draft.education || []).length > 0 && (
            <section style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "10px" }}>
                Education
              </h2>
              {(draft.education || []).map((edu, i) => (
                <div key={edu.id || i} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "12px" }}>{edu.degree || "Degree"}</strong>
                    <span style={{ fontSize: "10.5px", color: "#6b7280" }}>{edu.year}</span>
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "11px" }}>{edu.institution}</div>
                </div>
              ))}
            </section>
          )}
        </div>

        {isPurple && (
          <div style={{ flex: "1 1 35%", borderLeft: "1px solid #e5e7eb", paddingLeft: "20px" }}>
            {skills.length > 0 && (
              <section style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "10px" }}>
                  Skills
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.map((s, i) => (
                    <span key={i} style={{ background: "#ede9fe", color: "#5b21b6", borderRadius: "4px", padding: "2px 8px", fontSize: "10.5px", fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </section>
            )}
            {certs.length > 0 && (
              <section>
                <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "10px" }}>
                  Certifications
                </h2>
                <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
                  {certs.map((c, i) => <li key={i} style={{ fontSize: "11px", color: "#374151", marginBottom: "4px" }}>{c}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {!isPurple && (skills.length > 0 || certs.length > 0) && (
        <div style={{ padding: "0 32px 24px" }}>
          {skills.length > 0 && (
            <section style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "8px" }}>
                Skills
              </h2>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#374151" }}>{skills.join(" · ")}</p>
            </section>
          )}
          {certs.length > 0 && (
            <section>
              <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "4px", marginBottom: "8px" }}>
                Certifications
              </h2>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#374151" }}>{certs.join(" · ")}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
});
ResumePreview.displayName = "ResumePreview";

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export const ResumeBuilder = () => {
  const [draft, setDraft]             = useState(emptyDraft());
  const [template, setTemplate]       = useState("modern");
  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [savedAt, setSavedAt]         = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast]             = useState(null);

  const autoSaveTimer = useRef(null);
  const { score: atsScore, checks: atsChecks } = calcAtsScore(draft);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  // Load draft
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/resume-builder/draft");
        if (res.data?.exists && Object.keys(res.data.draft || {}).length > 0) {
          setDraft({ ...emptyDraft(), ...res.data.draft });
          setTemplate(res.data.template || "modern");
          setSavedAt(res.data.saved_at);
        }
      } catch (e) { console.error("Draft load:", e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Auto-save (debounced 2s)
  const persistDraft = useCallback(async (d, t) => {
    setSaving(true);
    try {
      const res = await api.put("/resume-builder/draft", { draft: d, template: t });
      setSavedAt(res.data?.saved_at || new Date().toISOString());
    } catch (e) { console.error("Auto-save:", e); }
    finally { setSaving(false); }
  }, []);

  useEffect(() => {
    if (loading) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persistDraft(draft, template), 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [draft, template, loading, persistDraft]);

  // Import from active resume
  const handleImportActive = async () => {
    setImportLoading(true);
    try {
      const res = await api.get("/resume/active");
      if (!res.data) { showToast("error", "No active resume found. Upload one in Resume Management first."); return; }
      const a = (await api.get("/resume-analysis").catch(() => ({ data: null }))).data;
      setDraft(prev => ({
        ...prev,
        name:       a?.name  || prev.name,
        email:      a?.email || prev.email,
        phone:      a?.phone || prev.phone,
        summary:    a?.resume_summary || a?.summary || prev.summary,
        skills:     Array.isArray(a?.skills) ? a.skills.join(", ") : prev.skills,
        experience: Array.isArray(a?.experience) && a.experience.length > 0
          ? a.experience.map((e, i) => ({ id: Date.now()+i, title: e.title||"", company: e.company||"", duration: e.duration||"", bullets: e.description||"" }))
          : prev.experience,
        education: Array.isArray(a?.education) && a.education.length > 0
          ? a.education.map((e, i) => ({ id: Date.now()+100+i, degree: e.degree||"", institution: e.college||"", year: e.year||"" }))
          : prev.education,
        certifications: Array.isArray(a?.certifications) ? a.certifications.join(", ") : prev.certifications,
      }));
      showToast("success", "Imported from active resume! Review and edit the fields below.");
    } catch (e) {
      showToast("error", "Import failed: " + (e?.response?.data?.detail || e.message));
    } finally { setImportLoading(false); }
  };

  // PDF Export
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element  = document.getElementById("resume-preview-root");
      if (!element) { showToast("error", "Preview not ready. Please wait."); return; }
      await html2pdf().set({
        margin:      [8, 8],
        filename:    `${(draft.name || "resume").replace(/\s+/g, "_")}_resume.pdf`,
        image:       { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(element).save();
      showToast("success", "PDF downloaded successfully!");
    } catch (e) {
      showToast("error", "PDF export failed. Please try again.");
    } finally { setExporting(false); }
  };

  // State helpers
  const setField    = (k, v) => setDraft(p => ({ ...p, [k]: v }));
  const setExpField = (idx, k, v) => setDraft(p => ({ ...p, experience: p.experience.map((e, i) => i===idx ? {...e,[k]:v} : e) }));
  const setEduField = (idx, k, v) => setDraft(p => ({ ...p, education:  p.education.map((e, i)  => i===idx ? {...e,[k]:v} : e) }));
  const addExp = () => setDraft(p => ({ ...p, experience: [...p.experience, { id: Date.now(), title:"", company:"", duration:"", bullets:"" }] }));
  const removeExp = (idx) => setDraft(p => ({ ...p, experience: p.experience.filter((_,i) => i!==idx) }));
  const addEdu = () => setDraft(p => ({ ...p, education: [...p.education, { id: Date.now(), degree:"", institution:"", year:"" }] }));
  const removeEdu = (idx) => setDraft(p => ({ ...p, education: p.education.filter((_,i) => i!==idx) }));

  const isStepDone = (s) => {
    if (s===0) return !!(draft.name && draft.email);
    if (s===1) return draft.summary?.length > 40;
    if (s===2) return (draft.experience||[]).some(e => e.company||e.title);
    if (s===3) return draft.skills?.trim().length > 0;
    if (s===4) return (draft.education||[]).some(e => e.institution||e.degree);
    return false;
  };

  const inp   = "w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors";
  const lbl   = "text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 block";
  const atsColour     = atsScore>=75 ? "#22c55e" : atsScore>=50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 40;
  const dashOffset    = circumference - (atsScore/100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border ${toast.type==="success" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
          style={{ animation: "fadeInDown 0.35s ease" }}>
          <div className="flex items-center gap-3">
            {toast.type==="success"
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0"/>
              : <AlertCircle  className="w-5 h-5 text-red-400 flex-shrink-0"/>}
            <span className={`text-xs font-extrabold ${toast.type==="success" ? "text-emerald-300" : "text-red-300"}`}>{toast.msg}</span>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4"/>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-600/20">
              <Layout className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-wider">Resume Builder</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Design, edit and export a recruiter-ready resume in real time.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/60 border border-white/8 rounded-xl">
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin"/><span className="text-xs font-bold text-amber-400">Auto-Saving...</span></>
            ) : savedAt ? (
              <><Database className="w-3.5 h-3.5 text-emerald-400"/><span className="text-xs font-bold text-emerald-400">PostgreSQL Synced · Saved {relativeTime(savedAt)}</span></>
            ) : (
              <><Clock className="w-3.5 h-3.5 text-slate-400"/><span className="text-xs font-bold text-slate-400">Draft Auto-Save</span></>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions + ATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400"/>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400"/>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Template:</span>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border cursor-pointer ${template===t.id ? "border-purple-500/50 bg-purple-600/20 text-purple-300" : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleImportActive} disabled={importLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 border border-white/10 hover:border-purple-500/40 text-white text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50">
              {importLoading ? <Loader2 className="w-4 h-4 animate-spin text-purple-400"/> : <Upload className="w-4 h-4 text-purple-400"/>}
              Import from Active Resume
            </button>
            <button onClick={handleExportPDF} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-60">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
              Export as PDF
            </button>
            <button onClick={() => { setDraft(emptyDraft()); showToast("success", "Draft cleared — start fresh!"); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-black rounded-xl transition-all cursor-pointer">
              <Trash2 className="w-4 h-4"/> Clear Draft
            </button>
          </div>
        </div>

        {/* ATS Score */}
        <div className="p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
            <FileCheck className="w-4 h-4 text-purple-400"/>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">ATS Score</h3>
            <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 relative w-[100px] h-[100px]">
              <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10"/>
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={atsColour} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{atsScore}</span>
                <span className="text-[9px] font-bold text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {atsChecks.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  {c.ok
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5"/>
                    : <AlertCircle  className="w-3 h-3 text-amber-400  flex-shrink-0 mt-0.5"/>}
                  <span className={`text-[10px] font-semibold leading-tight ${c.ok ? "text-emerald-300" : "text-amber-300"}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Builder main card */}
      <div className="p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-6">
          <Sparkles className="w-4 h-4 text-purple-400"/>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Build Your Resume</h3>
        </div>

        {/* Step tracker */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const done   = isStepDone(s.id);
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <button onClick={() => setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
                    active ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                    : done  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    :         "bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  {done && !active ? <CheckCircle2 className="w-3.5 h-3.5"/> : <s.icon className="w-3.5 h-3.5"/>}
                  {s.label}
                </button>
                {i < STEPS.length-1 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0"/>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Two-column: form + preview */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* FORM */}
          <div className="space-y-5">

            {step === 0 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Full Name</label><input className={inp} placeholder="Harsh Kumar Jha" value={draft.name} onChange={e=>setField("name",e.target.value)}/></div>
                  <div><label className={lbl}>Target Role</label><input className={inp} placeholder="AI Engineer" value={draft.targetRole} onChange={e=>setField("targetRole",e.target.value)}/></div>
                  <div><label className={lbl}>Email</label><input className={inp} placeholder="you@email.com" value={draft.email} onChange={e=>setField("email",e.target.value)}/></div>
                  <div><label className={lbl}>Phone</label><input className={inp} placeholder="+91 98765 43210" value={draft.phone} onChange={e=>setField("phone",e.target.value)}/></div>
                  <div><label className={lbl}>Location</label><input className={inp} placeholder="Bengaluru, India" value={draft.location} onChange={e=>setField("location",e.target.value)}/></div>
                  <div><label className={lbl}>LinkedIn</label><input className={inp} placeholder="linkedin.com/in/harsh" value={draft.linkedin} onChange={e=>setField("linkedin",e.target.value)}/></div>
                  <div className="sm:col-span-2"><label className={lbl}>GitHub</label><input className={inp} placeholder="github.com/harsh" value={draft.github} onChange={e=>setField("github",e.target.value)}/></div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Professional Summary</p>
                <div>
                  <label className={lbl}>Summary (2–4 sentences)</label>
                  <textarea className={`${inp} min-h-[140px] resize-y`}
                    placeholder="Results-driven AI Engineer with 4+ years of experience building production ML pipelines..."
                    value={draft.summary} onChange={e=>setField("summary",e.target.value)}/>
                  <p className="text-[10px] text-slate-500 mt-1">{(draft.summary||"").length} characters</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Work Experience</p>
                {(draft.experience||[]).map((exp,idx) => (
                  <div key={exp.id||idx} className="p-4 bg-slate-800/40 border border-white/8 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Position #{idx+1}</span>
                      {(draft.experience||[]).length > 1 && (
                        <button onClick={()=>removeExp(idx)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className={lbl}>Job Title</label><input className={inp} placeholder="Software Engineer" value={exp.title} onChange={e=>setExpField(idx,"title",e.target.value)}/></div>
                      <div><label className={lbl}>Company</label><input className={inp} placeholder="Google" value={exp.company} onChange={e=>setExpField(idx,"company",e.target.value)}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Duration</label><input className={inp} placeholder="Jan 2022 – Present" value={exp.duration} onChange={e=>setExpField(idx,"duration",e.target.value)}/></div>
                    </div>
                    <div>
                      <label className={lbl}>Bullet Points (one per line — include numbers!)</label>
                      <textarea className={`${inp} min-h-[100px] resize-y`}
                        placeholder={"• Built ETL pipeline processing 5M+ records/day\n• Reduced inference latency by 40% via quantization"}
                        value={exp.bullets} onChange={e=>setExpField(idx,"bullets",e.target.value)}/>
                    </div>
                  </div>
                ))}
                <button onClick={addExp}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-purple-500/40 rounded-xl text-xs font-black text-purple-400 hover:bg-purple-600/10 transition-all cursor-pointer w-full justify-center">
                  <Plus className="w-4 h-4"/> Add Another Position
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Skills &amp; Certifications</p>
                <div>
                  <label className={lbl}>Technical Skills (comma-separated)</label>
                  <textarea className={`${inp} min-h-[100px] resize-y`}
                    placeholder="Python, React, FastAPI, PostgreSQL, Docker, TensorFlow..."
                    value={draft.skills} onChange={e=>setField("skills",e.target.value)}/>
                  {draft.skills && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {draft.skills.split(",").map(s=>s.trim()).filter(Boolean).map((s,i)=>(
                        <span key={i} className="px-2.5 py-1 bg-purple-600/15 border border-purple-500/20 text-purple-300 rounded-lg text-[10px] font-bold">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={lbl}>Certifications (comma-separated)</label>
                  <textarea className={`${inp} min-h-[80px] resize-y`}
                    placeholder="AWS Certified ML Specialty, Google Professional Cloud Architect..."
                    value={draft.certifications} onChange={e=>setField("certifications",e.target.value)}/>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Education</p>
                {(draft.education||[]).map((edu,idx) => (
                  <div key={edu.id||idx} className="p-4 bg-slate-800/40 border border-white/8 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Institution #{idx+1}</span>
                      {(draft.education||[]).length > 1 && (
                        <button onClick={()=>removeEdu(idx)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className={lbl}>Degree</label><input className={inp} placeholder="B.Tech Computer Science" value={edu.degree} onChange={e=>setEduField(idx,"degree",e.target.value)}/></div>
                      <div><label className={lbl}>Year</label><input className={inp} placeholder="2020 – 2024" value={edu.year} onChange={e=>setEduField(idx,"year",e.target.value)}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Institution</label><input className={inp} placeholder="IIT Delhi" value={edu.institution} onChange={e=>setEduField(idx,"institution",e.target.value)}/></div>
                    </div>
                  </div>
                ))}
                <button onClick={addEdu}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-purple-500/40 rounded-xl text-xs font-black text-purple-400 hover:bg-purple-600/10 transition-all cursor-pointer w-full justify-center">
                  <Plus className="w-4 h-4"/> Add Another Institution
                </button>
              </div>
            )}

            {/* Back / Next */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/60 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4"/> Back
              </button>
              <span className="text-[10px] font-bold text-slate-500">Step {step+1} of {STEPS.length}</span>
              <button onClick={()=>setStep(s=>Math.min(STEPS.length-1,s+1))} disabled={step===STEPS.length-1}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                Next <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400"/>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${template==="modern" ? "bg-purple-600/20 text-purple-300" : "bg-blue-600/20 text-blue-300"}`}>
                  {template}
                </span>
              </div>
              <button onClick={handleExportPDF} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/15 border border-purple-500/25 text-purple-400 hover:bg-purple-600/25 rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-50">
                {exporting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Download className="w-3 h-3"/>}
                Export PDF
              </button>
            </div>
            <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-3 overflow-auto max-h-[700px]">
              <div style={{ minWidth: "480px" }}>
                <ResumePreview draft={draft} template={template}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
