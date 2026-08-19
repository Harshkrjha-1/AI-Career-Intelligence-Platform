import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../services/api"

export const Landing = () => {
  const [stats, setStats] = useState({ active_users: 2847, resumes_analyzed: 14320 })

  useEffect(() => {
    api.get("/public/stats")
      .then(res => {
        if (res.data) {
          // Dynamic database counts added to base placeholder counts
          setStats({
            active_users: 2847 + (res.data.active_users || 0),
            resumes_analyzed: 14320 + (res.data.resumes_analyzed || 0)
          })
        }
      })
      .catch(err => {
        console.error("Failed to fetch public stats:", err)
      })
  }, [])

  return (
    <div className="landing-container">
      {/* Scope style block for the landing page exactly as given */}
      <style dangerouslySetInnerHTML={{__html: `
        :root{
          --bg:#0d0f1e;
          --panel:#13162a;
          --panel-border:#1e2340;
          --purple:#7c3aed;
          --purple-light:#a78bfa;
          --text:#e7e9f5;
          --muted:#8b90b0;
          --green:#22c55e;
        }
        .landing-container {
          background: var(--bg);
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text);
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .landing-container * {
          box-sizing: border-box;
        }
        /* ===== NAVBAR ===== */
        .landing-container .navbar{
          display:flex;align-items:center;justify-content:space-between;
          padding:16px 40px;border-bottom:1px solid var(--panel-border);
          background:rgba(13,15,30,0.95);backdrop-filter:blur(10px);
          position:sticky;top:0;z-index:100;
        }
        .landing-container .brand{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .landing-container .brand .logo{
          width:38px;height:38px;border-radius:10px;
          background:linear-gradient(135deg,#8b5cf6,#4f46e5);
          display:flex;align-items:center;justify-content:center;font-size:16px;
          box-shadow:0 4px 14px rgba(124,58,237,0.4);
          color: #fff;
        }
        .landing-container .brand .bname{
          font-size:16px;font-weight:800;letter-spacing:.3px;color:var(--text);
        }
        .landing-container .brand .bname span{color:var(--purple-light);}

        .landing-container .nav-right{display:flex;align-items:center;gap:16px;}

        /* Admin link — discreet, top-right, before Login */
        .landing-container .admin-link{
          font-size:11px;font-weight:600;color:var(--muted);text-decoration:none;
          padding:6px 10px;border-radius:6px;border:1px solid var(--panel-border);
          display:flex;align-items:center;gap:5px;letter-spacing:.3px;
          transition:color .2s,border-color .2s;
        }
        .landing-container .admin-link:hover{color:var(--purple-light);border-color:rgba(124,58,237,0.4);}
        .landing-container .admin-link .adot{width:6px;height:6px;border-radius:50%;background:#f87171;display:inline-block;}

        .landing-container .btn-login{
          font-size:13.5px;font-weight:600;color:var(--text);text-decoration:none;
          padding:9px 20px;border-radius:8px;border:1px solid var(--panel-border);
          background:transparent;transition:border-color .2s;
        }
        .landing-container .btn-login:hover{border-color:var(--purple);}
        .landing-container .btn-register{
          font-size:13.5px;font-weight:700;color:#fff;text-decoration:none;
          padding:9px 22px;border-radius:8px;
          background:linear-gradient(135deg,#8b5cf6,#6d28d9);
          box-shadow:0 4px 16px rgba(124,58,237,0.35);
          transition:filter .2s;
        }
        .landing-container .btn-register:hover{filter:brightness(1.1);}

        /* ===== HERO ===== */
        .landing-container .hero{
          display:grid;grid-template-columns:1fr 1fr;gap:40px;
          padding:80px 40px 60px;max-width:1200px;margin:0 auto;align-items:center;
        }
        @media (max-width: 991px) {
          .landing-container .hero {
            grid-template-columns: 1fr;
          }
        }
        .landing-container .hero-left{}
        .landing-container .hero-badge{
          display:inline-flex;align-items:center;gap:6px;
          font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;
          background:rgba(124,58,237,0.12);color:var(--purple-light);
          border:1px solid rgba(124,58,237,0.3);padding:6px 14px;border-radius:20px;margin-bottom:24px;
        }
        .landing-container .hero-left h1{
          font-size:52px;font-weight:900;line-height:1.1;margin-bottom:20px;letter-spacing:-.5px;
          color: #fff;
        }
        .landing-container .hero-left h1 .grad{
          background:linear-gradient(135deg,#a78bfa,#38bdf8);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .landing-container .hero-left p{font-size:15px;color:var(--muted);line-height:1.7;margin-bottom:36px;max-width:420px;}
        .landing-container .hero-ctas{display:flex;gap:14px;align-items:center;}
        .landing-container .cta-register{
          display:flex;align-items:center;gap:8px;
          font-size:14px;font-weight:700;color:#fff;text-decoration:none;
          padding:13px 28px;border-radius:10px;
          background:linear-gradient(135deg,#8b5cf6,#6d28d9);
          box-shadow:0 6px 24px rgba(124,58,237,0.4);
        }
        .landing-container .cta-login{
          font-size:14px;font-weight:700;color:var(--text);text-decoration:none;
          padding:13px 26px;border-radius:10px;
          border:1px solid var(--panel-border);background:#0d0f1e;
        }

        /* hero stats */
        .landing-container .hero-stats{display:flex;gap:28px;margin-top:40px;padding-top:28px;border-top:1px solid var(--panel-border);}
        .landing-container .hero-stat .n{font-size:22px;font-weight:800;color:var(--purple-light);}
        .landing-container .hero-stat .l{font-size:11px;color:var(--muted);margin-top:2px;}

        /* feature grid — right side */
        .landing-container .hero-right{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .landing-container .feat-card{
          background:var(--panel);border:1px solid var(--panel-border);border-radius:14px;padding:22px 18px;
          transition:border-color .2s,transform .2s;
        }
        .landing-container .feat-card:hover{border-color:rgba(124,58,237,0.4);transform:translateY(-2px);}
        .landing-container .feat-card.wide{grid-column:span 2;}
        .landing-container .feat-ic{
          width:40px;height:40px;border-radius:10px;margin-bottom:14px;
          display:flex;align-items:center;justify-content:center;font-size:18px;
          background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);
        }
        .landing-container .feat-card h3{font-size:14px;font-weight:700;margin-bottom:6px;color:#fff;}
        .landing-container .feat-card p{font-size:11.5px;color:var(--muted);line-height:1.5;}

        /* ===== HOW IT WORKS ===== */
        .landing-container .section{padding:60px 40px;max-width:1200px;margin:0 auto;}
        .landing-container .section-head{text-align:center;margin-bottom:40px;}
        .landing-container .section-head .eyebrow{font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--purple-light);margin-bottom:10px;}
        .landing-container .section-head h2{font-size:32px;font-weight:800;margin-bottom:10px;color:#fff;}
        .landing-container .section-head p{font-size:14px;color:var(--muted);}

        .landing-container .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
        @media (max-width: 768px) {
          .landing-container .steps {
            grid-template-columns: 1fr;
          }
        }
        .landing-container .step{background:var(--panel);border:1px solid var(--panel-border);border-radius:14px;padding:22px 18px;text-align:center;}
        .landing-container .step .snum{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;margin:0 auto 14px;color:#fff;}
        .landing-container .step h4{font-size:13px;font-weight:700;margin-bottom:6px;color:#fff;}
        .landing-container .step p{font-size:11px;color:var(--muted);line-height:1.5;}

        /* ===== FOOTER ===== */
        .landing-container footer{
          border-top:1px solid var(--panel-border);padding:24px 40px;
          display:flex;justify-content:space-between;align-items:center;
          font-size:12px;color:var(--muted);flex-wrap:wrap;gap:12px;
          margin-top: 40px;
        }
        .landing-container footer a{color:var(--muted);text-decoration:none;}
        .landing-container footer a:hover{color:var(--purple-light);}
        .landing-container .footer-admin{
          font-size:11px;color:var(--muted);text-decoration:none;
          display:flex;align-items:center;gap:5px;
          padding:5px 10px;border-radius:6px;border:1px solid var(--panel-border);
          transition:color .2s;
        }
        .landing-container .footer-admin:hover{color:var(--purple-light);}
      `}} />

      {/* NAVBAR */}
      <div className="navbar">
        <Link className="brand" to="/">
          <div className="logo">✦</div>
          <div className="bname">CAREER <span>INTEL</span></div>
        </Link>

        <div className="nav-right">
          <Link className="admin-link" to="/admin/login" title="Administrator access only">
            <span className="adot"></span> Admin
          </Link>
          <Link className="btn-login" to="/login">Login</Link>
          <Link className="btn-register" to="/register">Register</Link>
        </div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-badge">✦ AI Career Intelligence Platform</div>
          <h1>Analyze Your Career<br />with <span className="grad">AI Intelligence</span></h1>
          <p>Close skill gaps, evaluate resume ATS metrics, predict cost-adjusted salaries, and manage professional profiles.</p>
          <div className="hero-ctas">
            <Link className="cta-register" to="/register">Register →</Link>
            <Link className="cta-login" to="/login">Login</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="n">{stats.active_users.toLocaleString()}</div>
              <div className="l">Active Users</div>
            </div>
            <div className="hero-stat">
              <div className="n">{stats.resumes_analyzed.toLocaleString()}</div>
              <div className="l">Resumes Analyzed</div>
            </div>
            <div className="hero-stat">
              <div className="n">99.2%</div>
              <div className="l">Uptime</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="feat-card">
            <div className="feat-ic">🛡</div>
            <h3>AI Resume Analysis</h3>
            <p>Extract education, jobs history and details using NLP.</p>
          </div>
          <div className="feat-card">
            <div className="feat-ic">🧭</div>
            <h3>Skill Extraction</h3>
            <p>Identify tech languages and tools mapping standard vocabularies.</p>
          </div>
          <div className="feat-card">
            <div className="feat-ic">💼</div>
            <h3>Career Recommendations</h3>
            <p>Estimate target switches with dynamic matching indices.</p>
          </div>
          <div className="feat-card">
            <div className="feat-ic">🎓</div>
            <h3>Resume Scoring</h3>
            <p>Evaluate ATS compatibility coefficients and fix layout formats.</p>
          </div>
          <div className="feat-card wide">
            <div className="feat-ic">✦</div>
            <h3>Profile Management</h3>
            <p>Edit, save, and visualize academic, certified, and experience histories directly in PostgreSQL.</p>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section">
        <div className="section-head">
          <div className="eyebrow">How It Works</div>
          <h2>From Resume to Career Clarity in 4 Steps</h2>
          <p>Upload your resume — the AI does the rest.</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="snum">1</div>
            <h4>Register & Login</h4>
            <p>Create your candidate profile securely with email and password.</p>
          </div>
          <div className="step">
            <div className="snum">2</div>
            <h4>Upload Resume</h4>
            <p>Drop your PDF or DOCX — our NLP parser extracts every detail in seconds.</p>
          </div>
          <div className="step">
            <div className="snum">3</div>
            <h4>Get AI Insights</h4>
            <p>See your ATS score, skill gaps, career fit %, and personalized recommendations.</p>
          </div>
          <div className="step">
            <div className="snum">4</div>
            <h4>Apply & Grow</h4>
            <p>Discover live opportunities matched to your resume and bridge your skill gaps with courses.</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div>© 2026 Career Intelligence Platform · v2.4.1</div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Documentation</a>
          <Link className="footer-admin" to="/admin/login">🔒 Platform Admin</Link>
        </div>
      </footer>
    </div>
  )
}

export default Landing;
