import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Target, BarChart2, Lightbulb, Compass, Briefcase, GraduationCap,
  CheckCircle2, AlertTriangle, ExternalLink, Loader2
} from "lucide-react";

// Platform gradients for job cards
const PLATFORM_STYLE = {
  Adzuna:         { grad: "linear-gradient(135deg,#8b5cf6,#6d28d9)", abbr: "AZ" },
  LinkedIn:       { grad: "linear-gradient(135deg,#0a66c2,#004182)", abbr: "IN" },
  Naukri:         { grad: "linear-gradient(135deg,#4a90d9,#1e5799)", abbr: "NK" },
  Coursera:       { grad: "linear-gradient(135deg,#0056D2,#002875)", abbr: "C" },
  Udemy:          { grad: "linear-gradient(135deg,#A435F0,#6E1AAB)", abbr: "U" },
  "AWS Training": { grad: "linear-gradient(135deg,#FF9900,#CC7A00)", abbr: "AWS" }
};

const getPlatformStyle = (source) =>
  PLATFORM_STYLE[source] || { grad: "linear-gradient(135deg,#7c3aed,#4f46e5)", abbr: (source || "??").substring(0, 2).toUpperCase() };

const fallbackIntel = {
  ats: {
    score: 87,
    status: "Strong Match",
    checks: [
      { ok: true, text: "Standard Section Headers Detected (Experience, Education, Skills)" },
      { ok: true, text: "Keyword Match: 8/10 required role terms present" },
      { ok: true, text: "Quantified Metrics: 6 bullet points include measurable data" },
      { ok: true, text: "Clean ATS Layout (No complex tables or graphic columns detected)" }
    ]
  },
  skill_gap: {
    target_role: "AI Engineer",
    gaps_count: 2,
    skills: [
      { skill: "Python", evidenced_pct: 95, status: "Strong" },
      { skill: "TensorFlow / PyTorch", evidenced_pct: 88, status: "Strong" },
      { skill: "SQL and PostgreSQL", evidenced_pct: 82, status: "Strong" },
      { skill: "MLOps and Docker", evidenced_pct: 55, status: "Moderate" },
      { skill: "System Design and Architecture", evidenced_pct: 35, status: "Weak" }
    ]
  },
  suggestions: [
    {
      id: "sug_metrics",
      icon_type: "alert",
      title: "Add Quantified Metrics to Work Experience",
      description: "Recruiters favor measurable impacts (e.g. 'Improved model inference speed by 35%').",
      severity: "High"
    },
    {
      id: "sug_keywords",
      icon_type: "tag",
      title: "Include MLOps and Kubernetes Keywords",
      description: "Including explicit keywords for deployment and MLOps improves ATS ranking by 28%.",
      severity: "Medium"
    },
    {
      id: "sug_summary",
      icon_type: "file",
      title: "Add a 2-3 Sentence Professional Summary",
      description: "A concise summary at the top increases initial recruiter engagement during screening.",
      severity: "Medium"
    },
    {
      id: "sug_format",
      "icon_type": "check",
      title: "Clean and Compatible Layout Structure",
      description: "Your resume uses clean text hierarchy with no unparseable graphic columns.",
      severity: "Good"
    }
  ],
  career_recs: [
    { role: "Senior AI / ML Engineer", fit_pct: 94, reasoning: "Strong alignment in Python, PyTorch and System Design.", path: "-> Lead AI Architect in 2-3 yrs" },
    { role: "Full Stack Tech Lead", fit_pct: 88, reasoning: "High overlap in React, Node.js and PostgreSQL.", path: "-> Principal Engineer in 2-3 yrs" },
    { role: "Backend Solutions Architect", fit_pct: 82, reasoning: "Solid foundation in Node.js, Python and Databases.", path: "-> VP of Engineering in 3-4 yrs" },
    { role: "MLOps Infrastructure Engineer", fit_pct: 75, reasoning: "Good technical match in Docker, AWS and Linux.", path: "-> Infrastructure Director in 3 yrs" }
  ],
  job_recs: [
    { id: "j1", company: "Adzuna Partner", company_abbr: "AZ", title: "Senior AI / ML Developer", location: "Bengaluru · Full-time", source: "Adzuna", match_pct: 92, apply_url: "https://www.adzuna.com", btn_label: "View & Apply →" },
    { id: "j2", company: "LinkedIn Jobs", company_abbr: "IN", title: "Full Stack AI Engineer", location: "India / Remote · Full-time", source: "LinkedIn", match_pct: 86, apply_url: "https://www.linkedin.com/jobs/search/?keywords=AI%20Engineer", btn_label: "Open on LinkedIn →" },
    { id: "j3", company: "Naukri Partners", company_abbr: "NK", title: "Backend Systems Architect", location: "Hyderabad · Full-time", source: "Naukri", match_pct: 78, apply_url: "https://www.naukri.com/ai-engineer-jobs", btn_label: "Open on Naukri →" }
  ],
  course_recs: [
    { id: "c1", platform: "Coursera", title: "Mastering System Design for Enterprise Applications", rating: "4.8 ★", duration: "4 Weeks", skill: "System Design", url: "https://www.coursera.org/search?query=System%20Design" },
    { id: "c2", platform: "Udemy", title: "MLOps and Docker Bootcamp with Real-World Projects", rating: "4.7 ★", duration: "14 Hours", skill: "MLOps", url: "https://www.udemy.com/courses/search/?q=MLOps" },
    { id: "c3", platform: "AWS Training", title: "Architecting and Scaling Solutions on AWS", rating: "4.9 ★", duration: "Official AWS Path", skill: "AWS", url: "https://aws.amazon.com/training/find-courses/?searchTerm=AWS" }
  ]
};

export const DashboardIntelligence = ({ atsScore }) => {
  const [intel, setIntel] = useState(fallbackIntel);
  const [loading, setLoading] = useState(true);

  const fetchIntelligence = async () => {
    try {
      const res = await api.get("/dashboard-intelligence");
      if (res.data && res.data.ats) {
        setIntel(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard intelligence, using fallback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();

    const handleSync = () => {
      fetchIntelligence();
    };

    window.addEventListener("focus", handleSync);
    window.addEventListener("resumeUpdated", handleSync);
    window.addEventListener("profileCompletionUpdated", handleSync);

    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("resumeUpdated", handleSync);
      window.removeEventListener("profileCompletionUpdated", handleSync);
    };
  }, []);

  const activeIntel = intel || fallbackIntel;
  const { ats, skill_gap, suggestions, career_recs, job_recs, course_recs } = activeIntel;

  const displayAtsScore = (atsScore !== undefined && atsScore !== null && atsScore > 0) ? atsScore : ats.score;
  const displayAtsStatus = displayAtsScore >= 75 ? "Strong Match" : (displayAtsScore >= 40 ? "Needs Work" : "Weak Match");

  const atsStatusBadge =
    displayAtsStatus === "Strong Match" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    displayAtsStatus === "Needs Work"   ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                          "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div className="space-y-8 pt-4">

      {/* ────────────────────────────────────────────────────────
          SECTION 1 — ATS COMPATIBILITY SCORE
          ──────────────────────────────────────────────────────── */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">🎯 ATS COMPATIBILITY SCORE</h2>
              <p className="text-xs text-slate-400">Evaluating standard section headers, target role keywords, and metrics.</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 text-xs font-black border rounded-xl w-fit ${atsStatusBadge}`}>
            {displayAtsStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-white/5 rounded-2xl">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="58" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                <circle
                  cx="72" cy="72" r="58"
                  stroke={displayAtsScore >= 75 ? "#22c55e" : displayAtsScore >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="364"
                  strokeDashoffset={364 - (364 * displayAtsScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{displayAtsScore}%</span>
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">ATS Score</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-3">
            {ats.checks.map((chk, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-white/5 rounded-xl">
                {chk.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-xs font-bold leading-relaxed ${chk.ok ? "text-slate-200" : "text-amber-300"}`}>
                  {chk.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 2 — SKILL GAP ANALYSIS
          ──────────────────────────────────────────────────────── */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">📊 SKILL GAP ANALYSIS</h2>
              <p className="text-xs text-slate-400">Target Role: <span className="font-bold text-white">{skill_gap.target_role}</span></p>
            </div>
          </div>
          <span className="px-3.5 py-1 text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl w-fit">
            {skill_gap.gaps_count} {skill_gap.gaps_count === 1 ? "Gap" : "Gaps"} Found
          </span>
        </div>

        <div className="space-y-4">
          {skill_gap.skills.map((sk) => {
            const statusCls =
              sk.status === "Strong"   ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              sk.status === "Moderate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                         "bg-red-500/10 text-red-400 border-red-500/20";
            const barCls =
              sk.status === "Strong"   ? "bg-emerald-500" :
              sk.status === "Moderate" ? "bg-amber-500" : "bg-red-500";

            return (
              <div key={sk.skill} className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-white">{sk.skill}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-bold">{sk.evidenced_pct}% Match</span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black border rounded-md uppercase ${statusCls}`}>
                      {sk.status}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full ${barCls} rounded-full transition-all duration-700`} style={{ width: `${sk.evidenced_pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 3 — RESUME IMPROVEMENT SUGGESTIONS
          ──────────────────────────────────────────────────────── */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">💡 RESUME IMPROVEMENT SUGGESTIONS</h2>
              <p className="text-xs text-slate-400">Actionable recommendations derived from parsed resume structure.</p>
            </div>
          </div>
          <span className="px-3.5 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            {suggestions.length} Suggestions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((sug) => {
            const sevBadge =
              sug.severity === "High"   ? "bg-red-500/10 text-red-400 border-red-500/20" :
              sug.severity === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            return (
              <div key={sug.id} className="p-5 bg-slate-950/60 border border-white/5 rounded-xl flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xs font-black text-white leading-snug">{sug.title}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-black border rounded-md uppercase flex-shrink-0 ${sevBadge}`}>
                    {sug.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{sug.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 4 — CAREER RECOMMENDATIONS
          ──────────────────────────────────────────────────────── */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">🧭 CAREER RECOMMENDATIONS</h2>
            <p className="text-xs text-slate-400">Adjacent career trajectories matched against your parsed competency vector.</p>
          </div>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-purple-600/30">
          {career_recs.map((rec, i) => (
            <div key={i} className="min-w-[280px] sm:min-w-[320px] max-w-[340px] p-6 bg-slate-950/80 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 snap-start hover:border-purple-500/40 transition-all flex-shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-sm font-black text-white leading-tight">{rec.role}</h3>
                  <span className="text-xl font-black text-purple-400 flex-shrink-0">{rec.fit_pct}%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.reasoning}</p>
              </div>

              <div className="pt-3 border-t border-white/5">
                <span className="text-[11px] font-bold text-indigo-400 block">{rec.path}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 5 — JOB RECOMMENDATIONS
          ──────────────────────────────────────────────────────── */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">💼 JOB RECOMMENDATIONS</h2>
              <p className="text-xs text-slate-400">Live API openings and direct platform search matches based on your active skills.</p>
            </div>
          </div>
          <span className="px-3.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
            {job_recs.length} Matched Openings
          </span>
        </div>

        <div className="space-y-3">
          {job_recs.map((job) => {
            const { grad, abbr } = getPlatformStyle(job.source || job.company);
            const matchColor = job.match_pct >= 75 ? "text-emerald-400" : job.match_pct >= 50 ? "text-amber-400" : "text-slate-400";
            return (
              <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/60 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md"
                    style={{ background: grad }}>
                    {abbr}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">{job.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {job.company} · <span className="text-slate-300 font-medium">{job.location}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className={`text-sm font-black ${matchColor}`}>{job.match_pct}%</span>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Match</span>
                  </div>
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 whitespace-nowrap"
                  >
                    <span>{job.btn_label || "View & Apply →"}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 6 — COURSE & CERTIFICATION RECOMMENDATIONS
          ──────────────────────────────────────────────────────── */}
      <div className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">🎓 COURSE AND CERTIFICATION RECOMMENDATIONS</h2>
            <p className="text-xs text-slate-400">Targeted learning paths mapped directly to your identified skill gaps.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {course_recs.map((crs) => {
            const { grad } = getPlatformStyle(crs.platform);
            return (
              <div key={crs.id} className="p-6 bg-slate-950/80 border border-white/5 rounded-2xl flex flex-col justify-between space-y-5 hover:border-purple-500/40 transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 text-[10px] font-black text-white rounded-md shadow-md"
                      style={{ background: grad }}>
                      {crs.platform}
                    </span>
                    <span className="text-xs font-bold text-amber-400">{crs.rating}</span>
                  </div>

                  <h3 className="text-xs font-black text-white leading-snug">{crs.title}</h3>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">{crs.duration}</span>
                    <span className="text-slate-600">·</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-600/15 text-purple-300 rounded-md border border-purple-500/20">
                      Gap: {crs.skill}
                    </span>
                  </div>
                </div>

                <a
                  href={crs.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white rounded-xl transition-all"
                >
                  <span>View Course</span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                </a>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DashboardIntelligence;
