import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  Globe, RefreshCw, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Search, Briefcase, GraduationCap, Zap,
  MapPin, Clock, DollarSign, Tag, ChevronRight, X
} from "lucide-react";

// ─── Platform gradient & abbreviation map ───────────────────────────────────
const PLATFORM_STYLE = {
  Adzuna:      { grad: "linear-gradient(135deg,#8b5cf6,#6d28d9)", abbr: "AZ" },
  Devpost:     { grad: "linear-gradient(135deg,#22c55e,#15803d)", abbr: "DP" },
  Internshala: { grad: "linear-gradient(135deg,#0ea5e9,#0369a1)", abbr: "IS" },
  Unstop:      { grad: "linear-gradient(135deg,#f472b6,#be185d)", abbr: "UN" },
  LinkedIn:    { grad: "linear-gradient(135deg,#0a66c2,#004182)", abbr: "IN" },
  HackerEarth: { grad: "linear-gradient(135deg,#2c3e50,#0f1c2e)", abbr: "HE" },
  AICTE:       { grad: "linear-gradient(135deg,#f59e0b,#b45309)", abbr: "AI" },
  Naukri:      { grad: "linear-gradient(135deg,#4a90d9,#1e5799)", abbr: "NK" },
};

const getPlatformStyle = (source) =>
  PLATFORM_STYLE[source] || { grad: "linear-gradient(135deg,#7c3aed,#4f46e5)", abbr: (source||"??").substring(0,2).toUpperCase() };

// ─── Relative time helper ────────────────────────────────────────────────────
const relTime = (isoStr) => {
  if (!isoStr) return "just now";
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 60000);
  if (diff < 1)   return "just now";
  if (diff < 60)  return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff/60)} hr ago`;
  return `${Math.floor(diff/1440)} d ago`;
};

// ─── "Search More" platform config ──────────────────────────────────────────
const buildSearchMoreGroups = (skills, topSkillsApi) => {
  const top = (topSkillsApi && topSkillsApi.length > 0)
    ? topSkillsApi
    : (skills && skills.length > 0 ? skills.slice(0, 3) : ["Python", "React", "Node.js"]);

  const q1 = encodeURIComponent(top[0] || "Python");
  const q2 = encodeURIComponent(top[1] || "React");
  const q3 = encodeURIComponent(top[2] || "Node.js");

  const q1_q2_plus = `${q1}+${q2}`;
  const q1_q2_q3_space = `${q1}%20${q2}%20${q3}`;

  const cleanSlug = (str) => encodeURIComponent((str || "").toLowerCase().replace(/[^a-z0-9]/g, ''));
  const slug3 = top.map(cleanSlug).filter(Boolean).join("-");
  const slug2 = top.slice(0, 2).map(cleanSlug).filter(Boolean).join("-");

  return [
    {
      label: "INTERNSHIPS & ENTRY-LEVEL JOBS (INDIA)",
      platforms: [
        { name: "Internshala", color: "#0ea5e9", url: `https://internshala.com/internships/keywords-${slug2 || 'python-react'}` },
        { name: "AICTE Portal", color: "#f59e0b", url: "https://internship.aicte-india.org/" },
        { name: "Cuvette", color: "#fb923c", url: `https://cuvette.tech/jobs?search=${q1_q2_plus}` },
        { name: "Instahyre", color: "#00c896", url: `https://www.instahyre.com/search-jobs/?q=${q1_q2_plus}` },
      ],
    },
    {
      label: "JOBS (INDIA & GLOBAL)",
      platforms: [
        { name: "LinkedIn Jobs", color: "#0a66c2", url: `https://www.linkedin.com/jobs/search/?keywords=${q1_q2_q3_space}` },
        { name: "Naukri", color: "#4a90d9", url: `https://www.naukri.com/${slug3 || 'python-react-nodejs'}-jobs` },
        { name: "Foundit", color: "#7c3aed", url: `https://www.foundit.in/srp/results?query=${q1_q2_plus}` },
        { name: "Indeed", color: "#2557a7", url: `https://in.indeed.com/jobs?q=${q1_q2_plus}+developer` },
        { name: "Wellfound", color: "#000", border: "#444", url: `https://wellfound.com/jobs?q=${q1_q2_plus}` },
      ],
    },
    {
      label: "HACKATHONS & CODING COMPETITIONS",
      platforms: [
        { name: "Unstop", color: "#f472b6", url: `https://unstop.com/hackathons?searchTerm=${q1}` },
        { name: "Devfolio", color: "#7c5cff", url: "https://devfolio.co/hackathons" },
        { name: "HackerEarth", color: "#2c3e50", url: "https://www.hackerearth.com/challenges/hackathon/" },
        { name: "MLH", color: "#e63946", url: "https://mlh.io/seasons/2026/events" },
      ],
    },
  ];
};

// ─── Opportunity Card ────────────────────────────────────────────────────────
const OpportunityCard = ({ item }) => {
  const { grad, abbr } = getPlatformStyle(item.source);
  const isApi = item.card_type === "api";
  const matchColor = item.match_pct >= 75 ? "text-emerald-400" : item.match_pct >= 50 ? "text-amber-400" : "text-slate-400";

  const matchedSkills = item.matched_skills || item.tags || [];
  const missingSkills = item.missing_skills || [];

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-800/40 border border-white/8 rounded-2xl hover:border-purple-500/30 hover:bg-slate-800/60 transition-all duration-200 group">
      {/* Platform logo */}
      <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md"
        style={{ background: grad }}>
        {abbr}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-white leading-snug truncate group-hover:text-purple-300 transition-colors">
          {item.title}
        </h4>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex flex-wrap gap-x-2">
          {item.company && <span>{item.company}</span>}
          {item.location && <span>· {item.location}</span>}
          {item.duration && <span>· {item.duration}</span>}
          {item.stipend  && <span>· {item.stipend}</span>}
          <span className="text-purple-400/70">· {item.source}</span>
        </p>

        {/* Skill tags — Matched (purple/green) & Missing (grey/muted) */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {matchedSkills.map((t, i) => (
            <span key={`m-${i}`} className="px-2 py-0.5 bg-purple-600/15 border border-purple-500/20 text-purple-300 rounded-md text-[10px] font-bold">
              ✓ {t}
            </span>
          ))}
          {missingSkills.map((t, i) => (
            <span key={`miss-${i}`} className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/50 text-slate-400/80 rounded-md text-[10px] font-medium">
              {t} (missing)
            </span>
          ))}
        </div>

        {/* Deadline */}
        {item.deadline && (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md text-[10px] font-bold">
            <Clock className="w-2.5 h-2.5"/> {item.deadline}
          </span>
        )}
      </div>

      {/* Right: match % + button */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2 ml-2">
        <div className="text-center">
          <span className={`text-lg font-black ${matchColor}`}>{item.match_pct}%</span>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">MATCH</p>
        </div>
        <a
          href={item.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black rounded-lg shadow-md shadow-purple-600/20 transition-all whitespace-nowrap"
        >
          {isApi ? "View & Apply" : `Open on ${item.source}`}
          <ChevronRight className="w-3 h-3"/>
        </a>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export const LiveOpportunities = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState("all");
  const [error, setError]     = useState(null);

  const fetchOpportunities = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/opportunities${forceRefresh ? "?refresh=true" : ""}`);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load opportunities. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  // Tab filtering
  const opportunities = data?.opportunities || [];
  const filtered = activeTab === "all" ? opportunities
    : opportunities.filter(o => o.type === activeTab);

  const tabCounts = {
    all:        opportunities.length,
    internship: opportunities.filter(o => o.type === "internship").length,
    job:        opportunities.filter(o => o.type === "job").length,
    hackathon:  opportunities.filter(o => o.type === "hackathon").length,
  };

  const resumeSkills = data?.resume_skills || [];
  const topSkills    = data?.top_skills || [];
  const searchGroups = buildSearchMoreGroups(resumeSkills, topSkills);
  const fetchedAt    = data?.fetched_at;

  // ── shared input tab style ─────────────────────────────────────────────────
  const tabCls = (key) =>
    `px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
      activeTab === key
        ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
        : "bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin"/>
        <p className="text-xs font-bold text-slate-400">Fetching AI-matched opportunities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: HEADER CARD ── */}
      <div className="p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-600/20">
              <Globe className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-wider">Live Opportunities</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                AI-matched internships, jobs &amp; hackathons based on your active resume — refreshed daily.
              </p>
            </div>
          </div>

          {/* Matched-to chip */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-white/8 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched to</span>
            <span className="text-xs font-black text-white">
              {data?.resume_file || "No resume"}{data?.resume_version ? ` · v${data.resume_version}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0"/>
          <span className="text-xs font-bold text-red-300">{error}</span>
          <button onClick={() => fetchOpportunities(true)} className="ml-auto text-xs font-black text-red-400 hover:text-red-300 cursor-pointer">Retry</button>
        </div>
      )}

      {/* ── SECTION 2: RECOMMENDED FOR YOU ── */}
      <div className="p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl space-y-5">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400"/>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">✨ Recommended For You</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Live pulse pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
              </span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                Live · Updated {relTime(fetchedAt)}
              </span>
            </div>
            {/* Refresh button */}
            <button
              onClick={() => fetchOpportunities(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-white/10 hover:border-purple-500/30 text-slate-400 hover:text-purple-300 rounded-xl text-[10px] font-black transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}/>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button className={tabCls("all")}        onClick={() => setActiveTab("all")}>
            All <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-md text-[9px]">{tabCounts.all}</span>
          </button>
          <button className={tabCls("internship")} onClick={() => setActiveTab("internship")}>
            Internships <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-md text-[9px]">{tabCounts.internship}</span>
          </button>
          <button className={tabCls("job")}        onClick={() => setActiveTab("job")}>
            Jobs <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-md text-[9px]">{tabCounts.job}</span>
          </button>
          <button className={tabCls("hackathon")}  onClick={() => setActiveTab("hackathon")}>
            Hackathons <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-md text-[9px]">{tabCounts.hackathon}</span>
          </button>
        </div>

        {/* Opportunity cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Globe className="w-10 h-10 text-slate-600 mx-auto"/>
            <p className="text-sm font-black text-slate-400">No {activeTab === "all" ? "" : activeTab} results found.</p>
            <p className="text-xs text-slate-500">Upload a resume in Resume Management to get AI-matched results.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <OpportunityCard key={item.id} item={item}/>
            ))}
          </div>
        )}

        {/* Source note */}
        <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-white/5">
          ⓘ Adzuna &amp; Devpost results pull live data via official APIs and can be applied to directly.
          Internshala, Unstop, LinkedIn, HackerEarth, AICTE, and Naukri results are AI-matched search links
          — clicking opens the live, filtered results on their platform.
        </p>
      </div>

      {/* ── SECTION 3: SEARCH MORE ON TOP PLATFORMS ── */}
      <div className="p-6 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Search className="w-4 h-4 text-purple-400"/>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">🔎 Search More on Top Platforms</h3>
        </div>

        {/* Skills line */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Instantly search these platforms using skills extracted from{" "}
          <span className="text-purple-300 font-black">{data?.resume_file || "your resume"}</span>:{" "}
          <span className="text-slate-300">
            {resumeSkills.length > 0
              ? resumeSkills.join(", ")
              : "Upload a resume to see your skills here."}
          </span>
        </p>

        {/* Platform groups */}
        <div className="space-y-5">
          {searchGroups.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.platforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/60 border border-white/8 hover:border-purple-500/30 hover:bg-slate-800/90 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1"
                      style={{
                        background: p.color === "#000" ? "#000" : p.color,
                        ringColor:  p.border || p.color,
                        border:     p.border ? `1px solid ${p.border}` : "none",
                      }}
                    />
                    {p.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"/>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default LiveOpportunities;
