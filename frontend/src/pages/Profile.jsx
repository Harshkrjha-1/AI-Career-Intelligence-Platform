import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  User, Github, Linkedin, Briefcase, Award, Compass, Sparkles, 
  CheckCircle2, RotateCcw, FileText, Code, GraduationCap, 
  Loader2, Mail, AlertCircle, Phone
} from "lucide-react";

// Client-side field-weighted live calculation helper
const calculateLiveCompletionPercentage = (p) => {
  if (!p) return 0;
  let score = 0;
  if (p.fullName && p.fullName.trim().length > 0) score += 15;
  if (p.email && p.email.trim().length > 0) score += 20;
  if (p.skills && p.skills.trim().length > 0) score += 25;
  if (p.education && p.education.trim().length > 0) score += 15;
  if (p.phone && p.phone.trim().length > 0) score += 5;
  if (p.github && p.github.trim().length > 0) score += 5;
  if (p.linkedIn && p.linkedIn.trim().length > 0) score += 5;
  if (p.experience && p.experience.trim().length > 0) score += 4;
  if (p.certifications && p.certifications.trim().length > 0) score += 3;
  if (p.careerInterests && p.careerInterests.trim().length > 0) score += 3;
  return Math.min(100, score);
};

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completionPct, setCompletionPct] = useState(0);
  const [missingMandatoryFields, setMissingMandatoryFields] = useState([]);
  const [mandatoryCompleted, setMandatoryCompleted] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    github: "",
    linkedIn: "",
    education: "",
    skills: "",
    projects: "",
    experience: "",
    certifications: "",
    careerInterests: "",
    profilePicture: "",
    professionalSummary: ""
  });

  // Handle live input change with real-time percentage recalculation
  const handleFieldChange = (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    const livePct = calculateLiveCompletionPercentage(updated);
    setCompletionPct(livePct);
    window.dispatchEvent(new CustomEvent("profileCompletionUpdated", { detail: { completionPct: livePct } }));
    
    // Check mandatory fields status live
    const missing = [];
    if (!updated.fullName || updated.fullName.trim().length === 0) missing.push("Full Name");
    if (!updated.email || updated.email.trim().length === 0) missing.push("Email");
    if (!updated.skills || updated.skills.trim().length === 0) missing.push("Skills");
    if (!updated.education || updated.education.trim().length === 0) missing.push("Education");
    setMissingMandatoryFields(missing);
    setMandatoryCompleted(missing.length === 0);
  };

  // Load authenticated user profile directly from PostgreSQL API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile");
      const data = res.data || {};
      
      setMissingMandatoryFields(data.missing_mandatory_fields || []);
      setMandatoryCompleted(data.mandatory_completed || false);

      const eduText = Array.isArray(data.education) 
        ? data.education.map(e => typeof e === 'object' ? `${e.degree || ''} ${e.college || ''} (${e.year || ''})`.trim() : e).filter(Boolean).join('\n')
        : (data.education || "");
        
      const skillsText = Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || "");
      
      const expText = Array.isArray(data.experience)
        ? data.experience.map(x => typeof x === 'object' ? `${x.title || ''} at ${x.company || ''}: ${x.description || ''}`.trim() : x).filter(Boolean).join('\n')
        : (data.experience || "");

      const projText = Array.isArray(data.projects)
        ? data.projects.map(p => typeof p === 'object' ? `${p.title || ''}: ${p.description || ''}`.trim() : p).filter(Boolean).join('\n')
        : (data.projects || "");

      const certsText = Array.isArray(data.certifications) ? data.certifications.join('\n') : (data.certifications || "");
      const interestsText = Array.isArray(data.career_interests) ? data.career_interests.join(', ') : (data.career_interests || "");

      const loadedProfile = {
        fullName: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        github: data.github || "",
        linkedIn: data.linkedin || "",
        education: eduText,
        skills: skillsText,
        projects: projText,
        experience: expText,
        certifications: certsText,
        careerInterests: interestsText,
        profilePicture: data.profile_picture || "",
        professionalSummary: data.professional_summary || ""
      };

      setProfile(loadedProfile);
      
      // Calculate live initial completion percentage
      const initialPct = calculateLiveCompletionPercentage(loadedProfile);
      setCompletionPct(data.completion_percentage ?? initialPct);

    } catch (err) {
      console.error("Failed to load authenticated user profile from PostgreSQL", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setValidationError("");

    // 1. Email format validation
    if (profile.email && profile.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email.trim())) {
        setValidationError("Please enter a valid email address.");
        return;
      }
    }

    // 2. URL Formats Normalization & Validation
    let formattedGithub = profile.github ? profile.github.trim() : "";
    if (formattedGithub) {
      if (!/^https?:\/\//i.test(formattedGithub)) {
        formattedGithub = `https://${formattedGithub}`;
      }
      try {
        new URL(formattedGithub);
      } catch (err) {
        setValidationError("GitHub link must be a valid URL (e.g. https://github.com/username).");
        return;
      }
    }

    let formattedLinkedIn = profile.linkedIn ? profile.linkedIn.trim() : "";
    if (formattedLinkedIn) {
      if (!/^https?:\/\//i.test(formattedLinkedIn)) {
        formattedLinkedIn = `https://${formattedLinkedIn}`;
      }
      try {
        new URL(formattedLinkedIn);
      } catch (err) {
        setValidationError("LinkedIn link must be a valid URL (e.g. https://linkedin.com/in/username).");
        return;
      }
    }

    let formattedPicture = profile.profilePicture ? profile.profilePicture.trim() : "";
    if (formattedPicture && !/^https?:\/\//i.test(formattedPicture)) {
      formattedPicture = `https://${formattedPicture}`;
    }

    // Parse multiline string inputs into JSON arrays for database storage
    const parsedSkills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
    const parsedEducation = profile.education.split('\n').map(line => line.trim()).filter(Boolean).map(line => ({ college: line, degree: "Degree", year: "2024" }));
    const parsedExperience = profile.experience.split('\n').map(line => line.trim()).filter(Boolean).map(line => ({ title: line, company: "Company", description: line }));
    const parsedProjects = profile.projects.split('\n').map(line => line.trim()).filter(Boolean).map(line => ({ title: line, description: line }));
    const parsedCertifications = profile.certifications.split('\n').map(line => line.trim()).filter(Boolean);
    const parsedInterests = profile.careerInterests.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      full_name: profile.fullName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      github: formattedGithub,
      linkedin: formattedLinkedIn,
      education: parsedEducation,
      skills: parsedSkills,
      projects: parsedProjects,
      experience: parsedExperience,
      certifications: parsedCertifications,
      career_interests: parsedInterests,
      profile_picture: formattedPicture,
      professional_summary: profile.professionalSummary.trim()
    };

    try {
      setSaving(true);
      const res = await api.put("/profile/update", payload);
      const updated = res.data || {};
      
      const savedPct = updated.completion_percentage ?? calculateLiveCompletionPercentage(profile);
      setCompletionPct(savedPct);
      window.dispatchEvent(new CustomEvent("profileCompletionUpdated", { detail: { completionPct: savedPct } }));
      setMissingMandatoryFields(updated.missing_mandatory_fields || []);
      setMandatoryCompleted(updated.mandatory_completed || false);
      
      // Dispatch window focus event so top navbar candidate name updates in real time
      window.dispatchEvent(new Event("focus"));

      alert("Profile Saved & Synchronized with PostgreSQL successfully!");
    } catch (err) {
      console.error("Failed to update profile in PostgreSQL", err);
      const msg = err.response?.data?.detail || "Error updating profile in PostgreSQL. Please check inputs.";
      setValidationError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchProfile();
    setValidationError("");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-purple-500 font-bold text-lg">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span>Loading Profile Parameters...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2.5">
            <User className="w-6 h-6 text-purple-500" />
            Profile Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage your professional information and career preferences.
          </p>
        </div>
        
        {/* Dynamic Profile Completion Circle Widget */}
        <div className="px-5 py-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold rounded-xl flex items-center gap-3 w-fit shadow-md">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="19" stroke="#1e293b" strokeWidth="4" fill="transparent" />
              <circle 
                cx="24" cy="24" r="19" 
                stroke="#a855f7" strokeWidth="4" fill="transparent"
                strokeDasharray="120"
                strokeDashoffset={120 - (120 * completionPct) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-white">{completionPct}%</span>
          </div>
          <div>
            <span className="text-xs font-black text-white block">Profile Completion</span>
            <span className="text-[10px] text-purple-400 font-bold">PostgreSQL Dynamic</span>
          </div>
        </div>
      </div>

      {/* Mandatory Field Completion Status Banner */}
      {!mandatoryCompleted ? (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Incomplete Mandatory Fields</span>
          </div>
          <p className="text-xs text-slate-300">
            Complete the 4 mandatory fields to establish your core candidate profile:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {missingMandatoryFields.map((field, idx) => (
              <span key={idx} className="px-3 py-1 text-xs font-extrabold bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 shadow-sm">
                • {field}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Mandatory Profile Completed. Extra parameters add towards 100% completion.</span>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="p-8 bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl space-y-8 shadow-xl">
        
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/5">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Avatar" className="relative w-16 h-16 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="relative bg-slate-950 p-6 rounded-full border border-white/10 text-purple-400 flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left space-y-1 flex-1">
            <h3 className="text-base font-extrabold text-white">Professional Profile Identity</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">PostgreSQL Synchronized Database</p>
          </div>
        </div>

        {/* Form Grid */}
        <div className="space-y-6">

          {/* Section 1: Personal Information & Email */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Full Name (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Mandatory (15%)</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profile?.fullName || ""}
                  onChange={(e) => handleFieldChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Email Address (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    Email Address
                  </span>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Mandatory (20%)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile?.email || ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  Phone Number (5%)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profile?.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

              {/* Profile Picture URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Profile Picture URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  value={profile?.profilePicture || ""}
                  onChange={(e) => handleFieldChange("profilePicture", e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

            </div>

            {/* Professional Summary */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Professional Summary
              </label>
              <textarea
                name="professionalSummary"
                value={profile?.professionalSummary || ""}
                onChange={(e) => handleFieldChange("professionalSummary", e.target.value)}
                rows={3}
                placeholder="Detail-oriented AI/ML Engineer with experience building full-stack web applications..."
                className="w-full bg-slate-950/70 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Professional Links */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Professional Links
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-cyan-400" />
                  GitHub Profile URL (5%)
                </label>
                <input
                  type="text"
                  name="github"
                  value={profile?.github || ""}
                  onChange={(e) => handleFieldChange("github", e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-cyan-400" />
                  LinkedIn Profile URL (5%)
                </label>
                <input
                  type="text"
                  name="linkedIn"
                  value={profile?.linkedIn || ""}
                  onChange={(e) => handleFieldChange("linkedIn", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Skills & Education */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Skills & Education
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Skills (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    Technical Skills (Comma separated)
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Mandatory (25%)</span>
                </label>
                <input
                  type="text"
                  name="skills"
                  value={profile?.skills || ""}
                  onChange={(e) => handleFieldChange("skills", e.target.value)}
                  placeholder="Python, React, FastAPI, SQL, Machine Learning"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Education (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    Education Details
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Mandatory (15%)</span>
                </label>
                <textarea
                  name="education"
                  value={profile?.education || ""}
                  onChange={(e) => handleFieldChange("education", e.target.value)}
                  rows={2}
                  placeholder="B.Tech Computer Science - IIT Bombay (2024)"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 resize-none leading-relaxed"
                  required
                />
              </div>

            </div>
          </div>

          {/* Section 4: Experience, Projects & Certifications */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Experience, Projects & Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  Work Experience (4%)
                </label>
                <textarea
                  name="experience"
                  value={profile?.experience || ""}
                  onChange={(e) => handleFieldChange("experience", e.target.value)}
                  rows={2}
                  placeholder="AI Engineer Intern at Tech Corp: Built predictive classifiers"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 resize-none leading-relaxed"
                />
              </div>

              {/* Projects */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  Notable Projects
                </label>
                <textarea
                  name="projects"
                  value={profile?.projects || ""}
                  onChange={(e) => handleFieldChange("projects", e.target.value)}
                  rows={2}
                  placeholder="AI Career Intelligence Platform: React + FastAPI + PostgreSQL"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 resize-none leading-relaxed"
                />
              </div>

              {/* Certifications */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Certifications (3%)
                </label>
                <textarea
                  name="certifications"
                  value={profile?.certifications || ""}
                  onChange={(e) => handleFieldChange("certifications", e.target.value)}
                  rows={2}
                  placeholder="AWS Certified Solutions Architect&#10;Google Professional Data Engineer"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200 resize-none leading-relaxed"
                />
              </div>

              {/* Career Interests */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-pink-400" />
                  Career Interests & Target Roles (3%)
                </label>
                <input
                  type="text"
                  name="careerInterests"
                  value={profile?.careerInterests || ""}
                  onChange={(e) => handleFieldChange("careerInterests", e.target.value)}
                  placeholder="AI Engineer, Full Stack Architect, ML Scientist"
                  className="w-full bg-slate-950/70 border border-white/10 focus:border-pink-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Submit & Reset Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-white/5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-extrabold rounded-xl border border-white/10 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Fields</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-black rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Saving & Synchronizing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default Profile;
