import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────
  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [parseMonitor, setParseMonitor] = useState(null);
  const [atsMonitor, setAtsMonitor]     = useState(null);
  const [skillGap, setSkillGap]         = useState([]);
  const [careerRecs, setCareerRecs]     = useState([]);
  const [healthStatus, setHealthStatus] = useState([]);
  const [feedback, setFeedback]         = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);

  const [addUserModal, setAddUserModal]             = useState(false);
  const [respondModal, setRespondModal]             = useState(null);
  const [viewUserModal, setViewUserModal]           = useState(null);
  const [notifDropdown, setNotifDropdown]           = useState(false);

  const [newUser, setNewUser]   = useState({ name:"", email:"", password:"", is_admin:0 });
  const [respondText, setRespondText] = useState("");
  const [lastSynced, setLastSynced]   = useState(null);
  const [activeNav, setActiveNav]     = useState("Dashboard");

  const notifRef = useRef(null);

  // ── Safe single-endpoint fetcher ────────────────────────────
  const safeFetch = async (url) => {
    try {
      const r = await api.get(url);
      return r.data;
    } catch (e) {
      console.warn(`Admin fetch failed for ${url}:`, e?.response?.status, e?.message);
      return null;
    }
  };

  // ── Main fetch — each endpoint is independent ────────────────
  const fetchAll = useCallback(async (userSearch = "") => {
    setFetchError(null);
    const [s, u, pm, am, sg, cr, hl, fb, al, nt] = await Promise.all([
      safeFetch("/admin/dashboard-stats"),
      safeFetch(`/admin/users?search=${encodeURIComponent(userSearch)}`),
      safeFetch("/admin/parsing-monitor"),
      safeFetch("/admin/ats-monitor"),
      safeFetch("/admin/skill-gap"),
      safeFetch("/admin/career-recs"),
      safeFetch("/admin/system-health"),
      safeFetch("/admin/feedback"),
      safeFetch("/admin/activity-log"),
      safeFetch("/admin/notifications"),
    ]);

    if (s)  setStats(s);
    if (u)  setUsers(Array.isArray(u) ? u : []);
    if (pm) setParseMonitor(pm);
    if (am) setAtsMonitor(am);
    if (sg) setSkillGap(Array.isArray(sg) ? sg : []);
    if (cr) setCareerRecs(Array.isArray(cr) ? cr : []);
    if (hl) setHealthStatus(Array.isArray(hl) ? hl : []);
    if (fb) setFeedback(Array.isArray(fb) ? fb : []);
    if (al) setActivityLogs(Array.isArray(al) ? al : []);
    if (nt) setNotifications(Array.isArray(nt) ? nt : []);

    if (!s && !u) {
      setFetchError("Could not reach the admin API. Is the backend server running on port 8000?");
    }
    setLastSynced(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 30 seconds
    const autoRefresh = setInterval(() => fetchAll(searchQuery), 30000);
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => { clearInterval(autoRefresh); document.removeEventListener("mousedown", handler); };
  }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────
  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    navigate("/admin/login");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users/create", newUser);
      setAddUserModal(false);
      setNewUser({ name:"", email:"", password:"", is_admin:0 });
      fetchAll(searchQuery);
    } catch (err) { alert(err.response?.data?.detail || "Failed to create user."); }
  };

  const handleToggleSuspend = async (u) => {
    const act = u.is_suspended ? "restore" : "suspend";
    if (!window.confirm(`${act.charAt(0).toUpperCase()+act.slice(1)} ${u.name}?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/status`, { is_suspended: !u.is_suspended });
      fetchAll(searchQuery);
    } catch (err) { alert(err.response?.data?.detail || "Failed."); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`PERMANENTLY delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      fetchAll(searchQuery);
    } catch (err) { alert(err.response?.data?.detail || "Failed."); }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/feedback/${respondModal.id}/respond`, { response_text: respondText });
      setRespondModal(null); setRespondText("");
      fetchAll(searchQuery);
    } catch (err) { alert("Failed to respond."); }
  };

  const handleCloseTicket = async (id) => {
    if (!window.confirm("Mark this ticket as Resolved?")) return;
    try { await api.put(`/admin/feedback/${id}/close`); fetchAll(searchQuery); }
    catch (err) { alert("Failed."); }
  };

  const handleMarkRead = async () => {
    try { await api.post("/admin/notifications/read-all"); fetchAll(searchQuery); }
    catch (err) { console.error(err); }
  };

  const handleDownload = async (type) => {
    try {
      const res = await api.get(`/admin/reports/${type}`, { responseType: "blob" });
      const names = { "user-growth":"user_growth_report.csv", "ats-score":"ats_score_distribution.csv", "resume-parse":"resume_parse_log.txt", "feedback":"feedback_summary.txt", "full-export":"platform_data_export.zip" };
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = names[type] || "report"; document.body.appendChild(a); a.click(); a.remove();
    } catch (err) { alert("Failed to download report."); }
  };

  const unread = notifications.filter(n => n.is_unread === 1).length;
  const openTickets = feedback.filter(t => t.status === "Open").length;

  // ── Status helpers ─────────────────────────────────────────
  const healthStatusClass = (s) => s === "Operational" ? "ok" : s === "Elevated" ? "warn" : "down";

  // ── Nav items definition ───────────────────────────────────
  const NAV = [
    { section:"Overview", items:[
      { key:"Dashboard", ic:"▦" },
      { key:"Platform Analytics", ic:"📈" },
    ]},
    { section:"User Management", items:[
      { key:"All Users", ic:"👥", badge: stats ? stats.total_users : "" },
      { key:"Profile Management", ic:"👤" },
      { key:"Role & Permissions", ic:"🔒" },
    ]},
    { section:"Resume & Parsing", items:[
      { key:"Resume Management", ic:"📄" },
      { key:"Parsing Monitor", ic:"⚙" },
      { key:"Job Descriptions", ic:"📋" },
    ]},
    { section:"AI Intelligence", items:[
      { key:"ATS Score Monitor", ic:"🎯" },
      { key:"Skill Gap Analytics", ic:"📊" },
      { key:"Career Rec. Analytics", ic:"🧭" },
      { key:"Job Rec. Analytics", ic:"💼" },
      { key:"Course Management", ic:"🎓" },
    ]},
    { section:"Platform", items:[
      { key:"User Feedback", ic:"💬", badge: openTickets || "", badgeGreen: false },
      { key:"System & API Monitor", ic:"📡" },
      { key:"Notifications", ic:"🔔", badge: unread || "" },
      { key:"Reports & Exports", ic:"📑" },
      { key:"Data & Security", ic:"🛡" },
    ]},
    { section:"Settings", items:[
      { key:"Admin Settings", ic:"⚙" },
    ]},
  ];

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" }); };

  const navClick = (key) => {
    setActiveNav(key);
    const map = {
      "Dashboard": "sec-stats",
      "Platform Analytics": "sec-analytics",
      "All Users": "sec-users",
      "Profile Management": "sec-users",
      "Role & Permissions": "sec-rbac",
      "Resume Management": "sec-parsing",
      "Parsing Monitor": "sec-parsing",
      "ATS Score Monitor": "sec-ats",
      "Skill Gap Analytics": "sec-skillgap",
      "Career Rec. Analytics": "sec-careerrec",
      "Job Rec. Analytics": "sec-jobrec",
      "Course Management": "sec-courses",
      "User Feedback": "sec-feedback",
      "System & API Monitor": "sec-health",
      "Notifications": "sec-notifs",
      "Reports & Exports": "sec-reports",
      "Data & Security": "sec-security",
    };
    if (map[key]) scrollTo(map[key]);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"radial-gradient(ellipse at top,#0a0d1a 0%,#05060d 60%)", fontFamily:"'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif", color:"#e7e9f5" }}>
      <style>{CSS}</style>

      {/* ===== SIDEBAR ===== */}
      <div className="ac-sidebar">
        <div className="ac-brand">
          <div className="ac-logo">✦</div>
          <div>
            <div className="ac-bname">CAREER<br/>INTELLIGENCE</div>
            <div className="ac-btag">Admin Console</div>
          </div>
        </div>

        <div className="ac-nav">
          {NAV.map(group => (
            <React.Fragment key={group.section}>
              <div className="ac-nav-section">{group.section}</div>
              {group.items.map(item => (
                <div
                  key={item.key}
                  className={`ac-nav-item${activeNav === item.key ? " active" : ""}`}
                  onClick={() => navClick(item.key)}
                >
                  <span className="ac-nic">{item.ic}</span>
                  {item.key}
                  {item.badge ? <span className={`ac-badge${item.badgeGreen ? " green" : ""}`}>{item.badge}</span> : null}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="ac-footer">
          <div className="ac-chip">
            <div className="ac-av">SA</div>
            <div>
              <div className="ac-an">Super Admin</div>
              <div className="ac-ar">admin@careerintel.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN ===== */}
      <div className="ac-main">

        {/* TOPBAR */}
        <div className="ac-topbar">
          <div>
            <div className="ac-topbar-title">Admin Dashboard</div>
            <div className="ac-topbar-sub">
              {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} ·
              {loading ? " Loading live data…" : lastSynced ? ` Last synced ${lastSynced.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}` : " Fetching…"}
            </div>
          </div>

          <div className="ac-topbar-right">
            <div className="ac-live"><span className="ac-live-dot"></span>Live</div>
            <button className="ac-btn" onClick={() => fetchAll(searchQuery)} title="Refresh now">🔄 Refresh</button>
            <button className="ac-btn" onClick={() => handleDownload("user-growth")}>📊 Export Report</button>

            {/* Notification bell */}
            <div style={{ position:"relative" }} ref={notifRef}>
              <button className="ac-btn ac-notif-btn" onClick={() => setNotifDropdown(v => !v)}>
                🔔 {unread > 0 && <span className="ac-notif-dot"></span>}
              </button>
              {notifDropdown && (
                <div className="ac-notif-panel">
                  <div className="ac-notif-header">
                    <span>Notifications ({unread} unread)</span>
                    <button onClick={handleMarkRead} className="ac-notif-readall">Mark all read</button>
                  </div>
                  {notifications.slice(0,6).map(n => (
                    <div key={n.id} className={`ac-notif-item${n.is_unread ? " unread" : ""}`}>
                      <div className="ac-notif-icon">{n.icon}</div>
                      <div>
                        <div className="ac-notif-title">{n.title}</div>
                        <div className="ac-notif-msg">{n.message}</div>
                      </div>
                      <div className="ac-notif-time">{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="ac-btn ac-signout" onClick={handleSignOut}>⏻ Sign Out</button>
          </div>
        </div>

        {/* ──────── CONTENT ──────── */}
        <div className="ac-content">

          {/* ERROR BANNER */}
          {fetchError && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.35)", borderRadius:"12px", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"18px" }}>⚠️</span>
                <div>
                  <div style={{ fontWeight:700, color:"#ef4444", fontSize:"13px" }}>Backend Unreachable</div>
                  <div style={{ color:"#fca5a5", fontSize:"11.5px", marginTop:"2px" }}>{fetchError}</div>
                </div>
              </div>
              <button className="ac-btn" style={{ borderColor:"rgba(239,68,68,0.4)", color:"#ef4444" }} onClick={() => fetchAll(searchQuery)}>🔄 Retry</button>
            </div>
          )}

          {/* LOADING SKELETONS */}
          {loading && (
            <div className="ac-stats-grid">
              {[...Array(8)].map((_,i) => (
                <div key={i} className="ac-stat-card" style={{ animation:"acPulse 1.5s ease-in-out infinite" }}>
                  <div style={{ height:"28px", background:"#1a1f32", borderRadius:"6px", marginBottom:"8px" }}></div>
                  <div style={{ height:"14px", background:"#141827", borderRadius:"4px", width:"70%" }}></div>
                </div>
              ))}
            </div>
          )}

          {/* STATS GRID */}
          <div id="sec-stats" className="ac-stats-grid">
            {stats && [
              { val: stats.total_users,          lbl:"Total Registered Users",    ic:"👥", icClass:"purple", delta: stats.users_delta,         up:true  },
              { val: stats.resumes_parsed,        lbl:"Resumes Parsed",            ic:"📄", icClass:"green",  delta: stats.resumes_delta,       up:true  },
              { val: `${stats.avg_ats_score}%`,   lbl:"Avg ATS Score",             ic:"🎯", icClass:"amber",  delta: stats.ats_delta,           up:true  },
              { val: stats.platform_uptime,        lbl:"Platform Uptime",           ic:"📡", icClass:"teal",   delta: stats.uptime_delta,        up:true  },
              { val: stats.job_recs_sent,          lbl:"Job Recommendations Sent",  ic:"💼", icClass:"blue",   delta: stats.jobs_delta,          up:true  },
              { val: stats.courses_recommended,    lbl:"Courses Recommended",       ic:"🎓", icClass:"purple", delta: stats.courses_delta,       up:true  },
              { val: stats.open_tickets,           lbl:"Open Feedback Tickets",     ic:"💬", icClass:"red",    delta: stats.tickets_delta,       up:false },
              { val: stats.parse_success_rate,     lbl:"Parse Success Rate",        ic:"⚙",  icClass:"green",  delta: stats.parse_success_delta, up:true  },
            ].map((s,i) => (
              <div key={i} className="ac-stat-card">
                <div className="ac-stat-top">
                  <div>
                    <div className="ac-stat-val">{s.val}</div>
                    <div className="ac-stat-lbl">{s.lbl}</div>
                  </div>
                  <div className={`ac-stat-ic ${s.icClass}`}>{s.ic}</div>
                </div>
                <div className={`ac-stat-delta ${s.up ? "up" : "down"}`}>
                  {s.up ? "↑" : "↓"} {s.delta}
                </div>
              </div>
            ))}
          </div>

          {/* USER MANAGEMENT */}
          <div id="sec-users" className="ac-card">
            <div className="ac-section-title">
              <div className="ac-title"><span className="ac-ic">👥</span> USER MANAGEMENT</div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                <form onSubmit={e => { e.preventDefault(); fetchAll(searchQuery); }} style={{ display:"flex", gap:"6px" }}>
                  <input
                    className="ac-search"
                    placeholder="🔍 Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="ac-btn">Search</button>
                </form>
                <button className="ac-btn-primary" onClick={() => setAddUserModal(true)}>+ Add User</button>
              </div>
            </div>
            <table className="ac-table">
              <thead><tr><th>User</th><th>Role</th><th>Resume</th><th>ATS Score</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="ac-user-cell">
                        <div className="ac-user-av">{u.name.slice(0,2).toUpperCase()}</div>
                        <div><div className="ac-user-name">{u.name}</div><div className="ac-user-email">{u.email}</div></div>
                      </div>
                    </td>
                    <td>{u.is_admin ? "Admin" : "Candidate"}</td>
                    <td>{u.version_label}</td>
                    <td>
                      <span style={{ fontWeight:700, color: u.ats_score>=80?"#22c55e": u.ats_score>=50?"#f59e0b":"#ef4444" }}>
                        {u.ats_score > 0 ? `${u.ats_score}%` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`ac-status-dot ${u.is_suspended ? "red" : "green"}`}></span>
                      {u.is_suspended ? "Suspended" : "Active"}
                    </td>
                    <td>{u.created_at}</td>
                    <td>
                      <div className="ac-actions">
                        <button onClick={() => setViewUserModal(u)}>View</button>
                        {u.is_suspended
                          ? <button onClick={() => handleToggleSuspend(u)}>Restore</button>
                          : <button className="danger" onClick={() => handleToggleSuspend(u)}>Suspend</button>
                        }
                        <button className="danger" onClick={() => handleDelete(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:"24px", color:"#7b81a0" }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PARSING MONITOR + ATS MONITOR */}
          <div className="ac-two-col" id="sec-parsing">
            <div className="ac-card">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">⚙</span> RESUME PARSING MONITOR</div>
                {parseMonitor && <span className="ac-pill green">{(100 - (parseMonitor.failed_count/(parseMonitor.total_parsed||1))*100).toFixed(1)}% Success</span>}
              </div>
              {parseMonitor && <>
                <div className="ac-three-col" style={{ marginBottom:"16px" }}>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#22c55e" }}>{parseMonitor.total_parsed}</div><div className="ac-mk">Total Parsed</div></div>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#ef4444" }}>{parseMonitor.failed_count}</div><div className="ac-mk">Failed</div></div>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#f59e0b" }}>{parseMonitor.queued_count}</div><div className="ac-mk">Queued</div></div>
                </div>
                <Bar label="PDF Resumes"  pct={parseMonitor.pdf_pct}  color="#7c3aed,#a78bfa" pctColor="#22c55e" />
                <Bar label="DOCX Resumes" pct={parseMonitor.docx_pct} color="#0ea5e9,#38bdf8" pctColor="#22c55e" />
                <Bar label="Avg Parse Time" pct={70} color="#16a34a,#4ade80" pctColor="#7b81a0" valLabel={parseMonitor.avg_time} />
              </>}
            </div>

            <div className="ac-card" id="sec-ats">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">🎯</span> ATS SCORE &amp; ANALYSIS MONITOR</div>
              </div>
              {atsMonitor && <>
                <div className="ac-three-col" style={{ marginBottom:"16px" }}>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#22c55e" }}>{atsMonitor.average}</div><div className="ac-mk">Platform Avg</div></div>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#a78bfa" }}>{atsMonitor.highest}</div><div className="ac-mk">Highest</div></div>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#ef4444" }}>{atsMonitor.lowest}</div><div className="ac-mk">Lowest</div></div>
                </div>
                <Bar label="90–100% (Excellent)" pct={atsMonitor.excellent_pct} color="#16a34a,#4ade80" pctColor="#22c55e" />
                <Bar label="70–89% (Good)"       pct={atsMonitor.good_pct}      color="#7c3aed,#a78bfa" pctColor="#a78bfa" />
                <Bar label="50–69% (Fair)"        pct={atsMonitor.fair_pct}      color="#d97706,#fbbf24" pctColor="#f59e0b" />
                <Bar label="Below 50% (Weak)"     pct={atsMonitor.weak_pct}      color="#dc2626,#f87171" pctColor="#ef4444" />
              </>}
            </div>
          </div>

          {/* SKILL GAP + CAREER REC ANALYTICS */}
          <div className="ac-two-col" id="sec-skillgap">
            <div className="ac-card" id="sec-analytics">
              <div className="ac-section-title"><div className="ac-title"><span className="ac-ic">📊</span> SKILL GAP ANALYTICS</div></div>
              {skillGap.map(s => (
                <Bar key={s.skill} label={s.skill} pct={s.pct} color="#dc2626,#f87171" pctColor={s.pct>=60?"#ef4444":"#f59e0b"} />
              ))}
              <div style={{ fontSize:"10.5px", color:"#7b81a0", marginTop:"12px" }}>% of users with gap in this skill across all parsed resumes</div>
            </div>

            <div className="ac-card" id="sec-careerrec">
              <div className="ac-section-title"><div className="ac-title"><span className="ac-ic">🧭</span> CAREER REC. ANALYTICS</div></div>
              {careerRecs.map((r,i) => {
                const colors = ["#7c3aed,#a78bfa","#0ea5e9,#38bdf8","#16a34a,#4ade80","#d97706,#fbbf24","#2dd4bf,#0ea5e9"];
                const ptColors = ["#a78bfa","#38bdf8","#22c55e","#f59e0b","#2dd4bf"];
                return <Bar key={r.role} label={r.role} pct={r.pct} color={colors[i]||"#7c3aed,#a78bfa"} pctColor={ptColors[i]||"#a78bfa"} />;
              })}
              <div style={{ fontSize:"10.5px", color:"#7b81a0", marginTop:"12px" }}>Most recommended career path per user segment</div>
            </div>
          </div>

          {/* JOB REC ANALYTICS + COURSE MANAGEMENT */}
          <div className="ac-two-col" id="sec-jobrec">
            <div className="ac-card">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">💼</span> JOB RECOMMENDATION ANALYTICS</div>
              </div>
              {stats && (
                <div className="ac-three-col" style={{ marginBottom:"14px" }}>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#22c55e" }}>{stats.job_recs_sent}</div><div className="ac-mk">Total Sent</div></div>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#38bdf8" }}>71%</div><div className="ac-mk">Click Rate</div></div>
                  <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#a78bfa" }}>84%</div><div className="ac-mk">Avg Match %</div></div>
                </div>
              )}
              <div className="ac-item-card"><div className="ac-item-top"><div className="ac-item-title">Backend Developer Intern — Fintrek Labs</div><span className="ac-pill green">94% match</span></div><div className="ac-item-meta">Adzuna API · 312 candidates matched · 224 clicked</div></div>
              <div className="ac-item-card"><div className="ac-item-top"><div className="ac-item-title">Full Stack Engineer — TrustSpring</div><span className="ac-pill amber">81% match</span></div><div className="ac-item-meta">LinkedIn Link · 198 candidates matched · 143 clicked</div></div>
              <div className="ac-item-card"><div className="ac-item-top"><div className="ac-item-title">AI Engineer — Nimbus Cloud</div><span className="ac-pill blue">87% match</span></div><div className="ac-item-meta">Adzuna API · 89 candidates matched · 67 clicked</div></div>
            </div>

            <div className="ac-card" id="sec-courses">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">🎓</span> COURSE &amp; CERT. MANAGEMENT</div>
                {stats && <span className="ac-pill blue">{stats.courses_recommended} recommended</span>}
              </div>
              <div className="ac-three-col" style={{ marginBottom:"14px" }}>
                <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#22c55e" }}>89%</div><div className="ac-mk">Relevance Score</div></div>
                <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#f59e0b" }}>62%</div><div className="ac-mk">Enroll Rate</div></div>
                <div className="ac-mini-metric"><div className="ac-mv" style={{ color:"#a78bfa" }}>47</div><div className="ac-mk">Active Courses</div></div>
              </div>
              <div className="ac-item-card"><div className="ac-item-top"><div className="ac-item-title">Kubernetes for Developers — Coursera</div><span className="ac-pill green">4.7 ⭐</span></div><div className="ac-item-meta">Recommended to 841 users · Gap: Kubernetes</div></div>
              <div className="ac-item-card"><div className="ac-item-top"><div className="ac-item-title">AWS Solutions Architect — AWS Training</div><span className="ac-pill green">4.8 ⭐</span></div><div className="ac-item-meta">Recommended to 623 users · Gap: Cloud/AWS</div></div>
              <div className="ac-item-card"><div className="ac-item-top"><div className="ac-item-title">GraphQL with Node.js — Udemy</div><span className="ac-pill amber">4.6 ⭐</span></div><div className="ac-item-meta">Recommended to 512 users · Gap: GraphQL</div></div>
            </div>
          </div>

          {/* NOTIFICATIONS + SYSTEM HEALTH */}
          <div className="ac-two-col" id="sec-notifs">
            <div className="ac-card">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">🔔</span> NOTIFICATIONS &amp; ALERTS</div>
                <span className="ac-pill red">{unread} Unread</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="ac-notif-row">
                  <div className={`ac-notif-nic ${n.category || "info"}`}>{n.icon}</div>
                  <div style={{ flex:1 }}>
                    <div className="ac-notif-row-title">{n.title}</div>
                    <div className="ac-notif-row-msg">{n.message}</div>
                  </div>
                  <div className="ac-notif-row-time">{n.time}</div>
                </div>
              ))}
            </div>

            <div className="ac-card" id="sec-health">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">📡</span> SYSTEM &amp; API MONITOR</div>
                <span className="ac-pill green">● All Systems Go</span>
              </div>
              {healthStatus.map((h,i) => (
                <div key={i} className="ac-api-row">
                  <div>
                    <div className="ac-api-name">{h.name}</div>
                    <div className="ac-api-sub">{h.sub}</div>
                  </div>
                  <span className={`ac-api-status ${healthStatusClass(h.status)}`}>{h.status}</span>
                  <div className={`ac-api-ms ${healthStatusClass(h.status)}`}>{h.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* USER FEEDBACK + ACTIVITY LOG */}
          <div className="ac-two-col" id="sec-feedback">
            <div className="ac-card">
              <div className="ac-section-title">
                <div className="ac-title"><span className="ac-ic">💬</span> USER FEEDBACK MANAGEMENT</div>
                <span className="ac-pill amber">{openTickets} Open</span>
              </div>
              <table className="ac-table">
                <thead><tr><th>User</th><th>Category</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {feedback.map(t => (
                    <tr key={t.id}>
                      <td>{t.user_name}</td>
                      <td>{t.category}</td>
                      <td><span className={`ac-pill ${t.status==="Open"?"red":t.status==="Pending"?"amber":"green"}`}>{t.status}</span></td>
                      <td>{t.date}</td>
                      <td>
                        <div className="ac-actions">
                          {t.status !== "Resolved" ? <>
                            <button onClick={() => { setRespondModal(t); setRespondText(t.response_text||""); }}>Respond</button>
                            <button onClick={() => handleCloseTicket(t.id)}>Close</button>
                          </> : <button onClick={() => setRespondModal(t)}>View</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ac-card">
              <div className="ac-section-title"><div className="ac-title"><span className="ac-ic">📋</span> PLATFORM ACTIVITY LOG</div></div>
              {activityLogs.map(l => (
                <div key={l.id} className="ac-activity-item">
                  <div className="ac-activity-ic">{l.icon}</div>
                  <div>
                    <div className="ac-activity-text">{l.action_text}</div>
                    <div className="ac-activity-time">{l.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPORTS + RBAC + DATA SECURITY */}
          <div className="ac-three-col" id="sec-reports">
            <div className="ac-card">
              <div className="ac-section-title"><div className="ac-title"><span className="ac-ic">📑</span> REPORTS &amp; EXPORTS</div></div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {[
                  { label:"📊 User Growth Report (CSV)",     type:"user-growth" },
                  { label:"📄 Resume Parse Log (PDF)",       type:"resume-parse" },
                  { label:"🎯 ATS Score Distribution (CSV)", type:"ats-score" },
                  { label:"💬 Feedback Summary (PDF)",       type:"feedback" },
                ].map(r => (
                  <button key={r.type} className="ac-report-btn" onClick={() => handleDownload(r.type)}>{r.label}</button>
                ))}
                <button className="ac-report-btn primary" onClick={() => handleDownload("full-export")}>📦 Full Platform Export (ZIP)</button>
              </div>
            </div>

            <div className="ac-card" id="sec-rbac">
              <div className="ac-section-title"><div className="ac-title"><span className="ac-ic">🔒</span> ROLE-BASED ACCESS CONTROL</div></div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {[
                  { role:"Super Admin", desc:`Full access · ${users.filter(u=>u.is_admin).length} users`,        pill:"red",    label:"Full" },
                  { role:"Moderator",   desc:"Feedback + users · 5 users",                                       pill:"amber",  label:"Limited" },
                  { role:"Analyst",     desc:"Read-only analytics · 8 users",                                    pill:"blue",   label:"Read Only" },
                  { role:"Candidate",   desc:`Own profile only · ${users.filter(u=>!u.is_admin).length} users`,  pill:"green",  label:"Restricted" },
                ].map(r => (
                  <div key={r.role} className="ac-rbac-row">
                    <div><div className="ac-rbac-role">{r.role}</div><div className="ac-rbac-desc">{r.desc}</div></div>
                    <span className={`ac-pill ${r.pill}`}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ac-card" id="sec-security">
              <div className="ac-section-title"><div className="ac-title"><span className="ac-ic">🛡</span> DATA &amp; SECURITY</div></div>
              {[
                { name:"SSL/TLS Encryption",    sub:"All connections encrypted",         status:"Active",     cls:"ok" },
                { name:"Data Backup",           sub:"Last backup: 6 hrs ago",            status:"Current",    cls:"ok" },
                { name:"GDPR Compliance",       sub:"Data deletion requests: 0",         status:"Compliant",  cls:"ok" },
                { name:"Failed Login Attempts", sub:"Last 24 hours",                     status:"3 detected", cls:"warn" },
                { name:"Admin Audit Log",       sub:"All platform actions logged in DB", status:"Active",     cls:"ok" },
              ].map(r => (
                <div key={r.name} className="ac-api-row" style={{ borderBottom:"1px solid #1c2036", padding:"8px 0" }}>
                  <div><div className="ac-api-name">{r.name}</div><div className="ac-api-sub">{r.sub}</div></div>
                  <span className={`ac-api-status ${r.cls}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end content */}
      </div>{/* end main */}

      {/* ══ MODALS ══════════════════════════════════════════ */}

      {/* Add User */}
      {addUserModal && (
        <div className="ac-modal-bg" onClick={() => setAddUserModal(false)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-title">+ Add New User Account</div>
            <form onSubmit={handleAddUser} className="ac-modal-form">
              <label>Full Name</label>
              <input required value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} />
              <label>Email Address</label>
              <input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} />
              <label>Password</label>
              <input required type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} />
              <label>Role</label>
              <select value={newUser.is_admin} onChange={e=>setNewUser({...newUser,is_admin:parseInt(e.target.value)})}>
                <option value={0}>Candidate</option>
                <option value={1}>Super Admin</option>
              </select>
              <div className="ac-modal-actions">
                <button type="button" className="ac-btn" onClick={() => setAddUserModal(false)}>Cancel</button>
                <button type="submit" className="ac-btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User */}
      {viewUserModal && (
        <div className="ac-modal-bg" onClick={() => setViewUserModal(null)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-title">User Details</div>
            <div className="ac-modal-detail-grid">
              {[
                ["User ID", `#${viewUserModal.id}`],
                ["Full Name", viewUserModal.name],
                ["Email", viewUserModal.email],
                ["Joined", viewUserModal.created_at],
                ["Role", viewUserModal.is_admin ? "Administrator" : "Candidate"],
                ["Resumes Uploaded", viewUserModal.resume_count],
                ["Active Resume", viewUserModal.version_label],
                ["ATS Score", viewUserModal.ats_score ? `${viewUserModal.ats_score}%` : "—"],
                ["Account Status", viewUserModal.is_suspended ? "Suspended" : "Active"],
              ].map(([k,v]) => (
                <React.Fragment key={k}><div className="ac-detail-key">{k}</div><div className="ac-detail-val">{v}</div></React.Fragment>
              ))}
            </div>
            <div className="ac-modal-actions">
              <button className="ac-btn" onClick={() => setViewUserModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Feedback */}
      {respondModal && (
        <div className="ac-modal-bg" onClick={() => setRespondModal(null)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-title">{respondModal.status === "Resolved" ? "Feedback Details" : "Respond to Feedback"}</div>
            <div style={{ background:"#060810", borderRadius:"8px", padding:"12px", marginBottom:"14px", fontSize:"12px", color:"#a0a8c0", lineHeight:"1.6" }}>
              <strong style={{ color:"#e7e9f5" }}>{respondModal.user_name}</strong> · {respondModal.category}<br/>
              {respondModal.message}
            </div>
            {respondModal.response_text && (
              <div style={{ background:"rgba(34,197,94,0.07)", borderRadius:"8px", padding:"12px", marginBottom:"14px", fontSize:"12px", color:"#a0a8c0" }}>
                <strong style={{ color:"#22c55e" }}>Admin Response:</strong> {respondModal.response_text}
              </div>
            )}
            {respondModal.status !== "Resolved" && (
              <form onSubmit={handleRespond} className="ac-modal-form">
                <label>Response Message</label>
                <textarea required rows={4} value={respondText} onChange={e=>setRespondText(e.target.value)} placeholder="Type support response..."/>
                <div className="ac-modal-actions">
                  <button type="button" className="ac-btn" onClick={() => setRespondModal(null)}>Cancel</button>
                  <button type="submit" className="ac-btn-primary">Submit Response</button>
                </div>
              </form>
            )}
            {respondModal.status === "Resolved" && (
              <div className="ac-modal-actions"><button className="ac-btn" onClick={() => setRespondModal(null)}>Close</button></div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

// ── Small helper component ────────────────────────────────────
const Bar = ({ label, pct, color, pctColor, valLabel }) => (
  <div className="ac-bar-row">
    <div className="ac-bar-label">{label}</div>
    <div className="ac-bar-track">
      <div className="ac-bar-fill" style={{ width:`${Math.min(pct,100)}%`, background:`linear-gradient(90deg,${color})` }}></div>
    </div>
    <div className="ac-bar-pct" style={{ color: pctColor }}>{valLabel ?? `${pct}%`}</div>
  </div>
);

// ── Scoped CSS string ────────────────────────────────────────
const CSS = `
  .ac-sidebar{width:220px;flex-shrink:0;background:#080a14;border-right:1px solid #1c2036;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;overflow-y:auto;}
  .ac-brand{display:flex;align-items:center;gap:10px;padding:20px 18px;border-bottom:1px solid #1c2036;}
  .ac-logo{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#8b5cf6,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;color:#fff;}
  .ac-bname{font-size:12px;font-weight:800;line-height:1.2;color:#e7e9f5;}
  .ac-btag{font-size:8.5px;font-weight:700;letter-spacing:.5px;color:#f87171;text-transform:uppercase;}
  .ac-nav{padding:14px 10px;flex:1;}
  .ac-nav-section{font-size:9px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#7b81a0;padding:10px 8px 6px;margin-top:8px;}
  .ac-nav-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:8px;font-size:12px;font-weight:600;color:#7b81a0;cursor:pointer;margin-bottom:2px;transition:background .15s,color .15s;}
  .ac-nav-item:hover{background:rgba(124,58,237,0.08);color:#e7e9f5;}
  .ac-nav-item.active{background:rgba(124,58,237,0.15);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);}
  .ac-nic{font-size:14px;width:18px;text-align:center;}
  .ac-badge{margin-left:auto;font-size:9px;font-weight:800;background:#ef4444;color:#fff;padding:2px 6px;border-radius:8px;}
  .ac-badge.green{background:#22c55e;color:#052e16;}
  .ac-footer{padding:14px 18px;border-top:1px solid #1c2036;}
  .ac-chip{display:flex;align-items:center;gap:10px;}
  .ac-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;}
  .ac-an{font-size:12px;font-weight:700;color:#e7e9f5;}
  .ac-ar{font-size:10px;color:#a78bfa;}

  .ac-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh;}
  .ac-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid #1c2036;background:#080a14;position:sticky;top:0;z-index:50;gap:12px;flex-wrap:wrap;}
  .ac-topbar-title{font-size:16px;font-weight:700;color:#fff;}
  .ac-topbar-sub{font-size:11.5px;color:#7b81a0;}
  .ac-topbar-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .ac-live{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#22c55e;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);padding:6px 12px;border-radius:20px;}
  .ac-live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;animation:acp 1.6s infinite;}
  @keyframes acp{0%{opacity:1;}50%{opacity:.4;}100%{opacity:1;}}
  .ac-btn{background:#101425;border:1px solid #1c2036;color:#e7e9f5;font-size:11.5px;font-weight:600;padding:8px 14px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:border-color .15s;}
  .ac-btn:hover{border-color:#7c3aed;}
  .ac-btn-primary{background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;color:#fff;font-size:11.5px;font-weight:600;padding:8px 14px;border-radius:8px;cursor:pointer;}
  .ac-signout{color:#f87171!important;border-color:rgba(239,68,68,0.3)!important;}
  .ac-notif-btn{position:relative;}
  .ac-notif-dot{position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:#ef4444;border-radius:50%;border:2px solid #080a14;}
  .ac-notif-panel{position:absolute;right:0;top:calc(100% + 8px);width:320px;background:#0c0f1c;border:1px solid #1c2036;border-radius:14px;padding:14px;z-index:200;box-shadow:0 20px 60px #000;}
  .ac-notif-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #1c2036;margin-bottom:10px;font-size:11px;font-weight:700;color:#fff;}
  .ac-notif-readall{background:none;border:none;color:#a78bfa;font-size:10px;font-weight:700;cursor:pointer;}
  .ac-notif-item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #1c2036;}
  .ac-notif-item:last-child{border-bottom:none;}
  .ac-notif-item.unread{background:rgba(124,58,237,0.04);border-radius:6px;padding:8px 6px;}
  .ac-notif-icon{font-size:13px;flex-shrink:0;margin-top:2px;}
  .ac-notif-title{font-size:11px;font-weight:600;color:#e7e9f5;}
  .ac-notif-msg{font-size:10px;color:#7b81a0;margin-top:2px;line-height:1.4;}
  .ac-notif-time{font-size:9.5px;color:#7b81a0;white-space:nowrap;margin-left:auto;flex-shrink:0;}

  .ac-content{padding:22px 24px;display:flex;flex-direction:column;gap:20px;}
  .ac-card{background:#0c0f1c;border:1px solid #1c2036;border-radius:14px;padding:20px 22px;}
  .ac-section-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:13px;border-bottom:1px solid #1c2036;flex-wrap:wrap;gap:8px;}
  .ac-title{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;letter-spacing:.3px;color:#fff;}
  .ac-ic{color:#a78bfa;}
  .ac-pill{font-size:10.5px;font-weight:700;padding:4px 11px;border-radius:16px;display:inline-block;}
  .ac-pill.green{background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.35);}
  .ac-pill.amber{background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.35);}
  .ac-pill.red{background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);}
  .ac-pill.blue{background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);}

  .ac-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  @media(max-width:1200px){.ac-stats-grid{grid-template-columns:repeat(2,1fr);}}
  .ac-stat-card{background:#0a0d18;border:1px solid #1c2036;border-radius:12px;padding:16px 18px;}
  .ac-stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
  .ac-stat-ic{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .ac-stat-ic.purple{background:rgba(124,58,237,0.15);}
  .ac-stat-ic.green{background:rgba(34,197,94,0.12);}
  .ac-stat-ic.amber{background:rgba(245,158,11,0.12);}
  .ac-stat-ic.blue{background:rgba(56,189,248,0.12);}
  .ac-stat-ic.red{background:rgba(239,68,68,0.1);}
  .ac-stat-ic.teal{background:rgba(45,212,191,0.12);}
  .ac-stat-val{font-size:24px;font-weight:800;color:#fff;margin-bottom:2px;}
  .ac-stat-lbl{font-size:11px;color:#7b81a0;}
  .ac-stat-delta{font-size:10.5px;font-weight:700;margin-top:6px;}
  .ac-stat-delta.up{color:#22c55e;} .ac-stat-delta.down{color:#ef4444;}

  .ac-search{background:#0d1120;border:1px solid #1c2036;color:#e7e9f5;padding:7px 12px;border-radius:7px;font-size:11.5px;width:200px;}
  .ac-search:focus{outline:none;border-color:#7c3aed;}
  .ac-table{width:100%;border-collapse:collapse;font-size:12px;}
  .ac-table thead th{text-align:left;color:#7b81a0;font-weight:700;font-size:10px;letter-spacing:.6px;text-transform:uppercase;padding:0 10px 11px;}
  .ac-table tbody td{padding:11px 10px;border-top:1px solid #1c2036;vertical-align:middle;color:#e7e9f5;}
  .ac-table tbody tr:hover{background:rgba(124,58,237,0.03);}
  .ac-user-cell{display:flex;align-items:center;gap:10px;}
  .ac-user-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;}
  .ac-user-name{font-weight:600;font-size:12px;color:#fff;}
  .ac-user-email{font-size:10.5px;color:#7b81a0;}
  .ac-status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px;}
  .ac-status-dot.green{background:#22c55e;} .ac-status-dot.red{background:#ef4444;}
  .ac-actions{display:flex;gap:6px;}
  .ac-actions button{background:#101425;border:1px solid #1c2036;color:#7b81a0;font-size:10.5px;padding:5px 9px;border-radius:6px;cursor:pointer;transition:color .15s,border-color .15s;}
  .ac-actions button:hover{color:#e7e9f5;border-color:#7c3aed;}
  .ac-actions button.danger{color:#f87171;}

  .ac-two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .ac-three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
  @media(max-width:1100px){.ac-two-col,.ac-three-col{grid-template-columns:1fr;}}

  .ac-bar-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
  .ac-bar-row:last-child{margin-bottom:0;}
  .ac-bar-label{font-size:11.5px;width:140px;flex-shrink:0;color:#e7e9f5;}
  .ac-bar-track{flex:1;height:7px;background:#161a2c;border-radius:5px;overflow:hidden;}
  .ac-bar-fill{height:100%;border-radius:5px;transition:width .5s ease;}
  .ac-bar-pct{font-size:11.5px;font-weight:700;width:40px;text-align:right;flex-shrink:0;}

  .ac-mini-metric{background:#0a0d18;border:1px solid #1c2036;border-radius:10px;padding:12px 14px;text-align:center;}
  .ac-mv{font-size:18px;font-weight:800;} .ac-mk{font-size:10px;color:#7b81a0;margin-top:3px;}

  .ac-item-card{background:#0a0d18;border:1px solid #1c2036;border-radius:10px;padding:13px 14px;margin-bottom:10px;}
  .ac-item-card:last-child{margin-bottom:0;}
  .ac-item-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
  .ac-item-title{font-size:12.5px;font-weight:600;color:#fff;}
  .ac-item-meta{font-size:10.5px;color:#7b81a0;}

  .ac-notif-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #1c2036;}
  .ac-notif-row:last-child{border-bottom:none;}
  .ac-notif-nic{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .ac-notif-nic.error{background:rgba(239,68,68,0.1);} .ac-notif-nic.warning{background:rgba(245,158,11,0.12);} .ac-notif-nic.info{background:rgba(56,189,248,0.12);}
  .ac-notif-row-title{font-size:12px;font-weight:600;color:#e7e9f5;margin-bottom:2px;}
  .ac-notif-row-msg{font-size:10.5px;color:#7b81a0;}
  .ac-notif-row-time{font-size:10px;color:#7b81a0;white-space:nowrap;margin-left:auto;flex-shrink:0;}

  .ac-api-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1c2036;}
  .ac-api-row:last-child{border-bottom:none;}
  .ac-api-name{font-size:12px;font-weight:600;color:#e7e9f5;}
  .ac-api-sub{font-size:10.5px;color:#7b81a0;}
  .ac-api-status{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:10px;}
  .ac-api-status.ok{background:rgba(34,197,94,0.12);color:#22c55e;}
  .ac-api-status.warn{background:rgba(245,158,11,0.12);color:#f59e0b;}
  .ac-api-status.down{background:rgba(239,68,68,0.1);color:#ef4444;}
  .ac-api-ms{font-size:11px;font-weight:700;width:60px;text-align:right;}
  .ac-api-ms.ok{color:#22c55e;} .ac-api-ms.warn{color:#f59e0b;} .ac-api-ms.down{color:#ef4444;}

  .ac-activity-item{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #1c2036;align-items:flex-start;}
  .ac-activity-item:last-child{border-bottom:none;}
  .ac-activity-ic{width:26px;height:26px;border-radius:7px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
  .ac-activity-text{font-size:11.5px;color:#e7e9f5;}
  .ac-activity-time{font-size:10px;color:#7b81a0;margin-top:2px;}

  .ac-report-btn{background:#0a0d18;border:1px solid #1c2036;color:#e7e9f5;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:600;text-align:left;cursor:pointer;transition:border-color .15s;}
  .ac-report-btn:hover{border-color:#7c3aed;}
  .ac-report-btn.primary{background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;color:#fff;}

  .ac-rbac-row{background:#0a0d18;border:1px solid #1c2036;border-radius:9px;padding:11px 14px;display:flex;justify-content:space-between;align-items:center;}
  .ac-rbac-role{font-size:12.5px;font-weight:700;color:#fff;}
  .ac-rbac-desc{font-size:10.5px;color:#7b81a0;}

  .ac-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;}
  .ac-modal{background:#0c0f1c;border:1px solid #1c2036;border-radius:16px;padding:24px;width:100%;max-width:440px;box-shadow:0 30px 80px #000;}
  .ac-modal-title{font-size:14px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.4px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #1c2036;}
  .ac-modal-form{display:flex;flex-direction:column;gap:12px;}
  .ac-modal-form label{font-size:10px;font-weight:700;color:#7b81a0;text-transform:uppercase;letter-spacing:.4px;}
  .ac-modal-form input,.ac-modal-form select,.ac-modal-form textarea{background:#060810;border:1px solid #1c2036;color:#e7e9f5;padding:10px 12px;border-radius:10px;font-size:12px;width:100%;font-family:inherit;}
  .ac-modal-form input:focus,.ac-modal-form select:focus,.ac-modal-form textarea:focus{outline:none;border-color:#7c3aed;}
  .ac-modal-form textarea{resize:vertical;}
  .ac-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:6px;}
  .ac-modal-detail-grid{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:12px;margin-bottom:18px;}
  .ac-detail-key{color:#7b81a0;font-weight:600;} .ac-detail-val{color:#e7e9f5;font-weight:700;}
  @keyframes acPulse{0%{opacity:1;}50%{opacity:.5;}100%{opacity:1;}}
`;

export default AdminDashboard;
