import React, { useEffect, useState } from "react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Link2, Plus, Trash2, Save, Loader2, Camera, Award
} from "lucide-react"

export const Profile: React.FC = () => {
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    summary: "",
    location: "",
    industry: "",
    experience_years: 0,
    current_salary: 0,
    target_salary: 0,
    social_links: { linkedin: "", github: "", portfolio: "" }
  })

  // List arrays
  const [education, setEducation] = useState<any[]>([])
  const [experience, setExperience] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [certifications, setCertifications] = useState<any[]>([])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get("/profile")
      const d = res.data
      setFormData({
        full_name: d.full_name || "",
        phone_number: d.phone_number || "",
        summary: d.summary || "",
        location: d.location || "",
        industry: d.industry || "",
        experience_years: d.experience_years || 0,
        current_salary: d.current_salary || 0,
        target_salary: d.target_salary || 0,
        social_links: {
          linkedin: d.social_links?.linkedin || "",
          github: d.social_links?.github || "",
          portfolio: d.social_links?.portfolio || ""
        }
      })
      setPhotoUrl(d.photo_url)
      setEducation(d.education || [])
      setExperience(d.experience || [])
      setProjects(d.projects || [])
      setSkills(d.skills || [])
      setCertifications(d.certifications || [])
    } catch (err) {
      console.error("Failed to load user profile data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const upData = new FormData()
      upData.append("file", file)
      try {
        const res = await api.post("/profile/upload-photo", upData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        setPhotoUrl(res.data.photo_url)
        await refreshUser()
      } catch (err) {
        alert("Failed to upload profile photo.")
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...formData,
        education,
        experience,
        projects,
        skills,
        certifications
      }
      const res = await api.put("/profile/update", payload)
      // Update local states
      setPhotoUrl(res.data.photo_url)
      await refreshUser()
      alert("Profile details updated successfully!")
    } catch (err) {
      alert("Failed to save profile details.")
    } finally {
      setSaving(false)
    }
  }

  // Dynamic Array Modifiers
  const addEducation = () => {
    setEducation([...education, { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "" }])
  }
  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const addExperience = () => {
    setExperience([...experience, { company: "", role: "", location: "", start_date: "", end_date: "", description: "", is_current: false }])
  }
  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index))
  }

  const addProject = () => {
    setProjects([...projects, { title: "", description: "", technologies: [], link: "" }])
  }
  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const addSkill = () => {
    setSkills([...skills, { name: "", proficiency: "intermediate" }])
  }
  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const addCert = () => {
    setCertifications([...certifications, { name: "", issuing_organization: "", issue_date: "", expiration_date: "", credential_url: "" }])
  }
  const removeCert = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-neonPurple">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 font-bold">Loading Profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Save Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            My Professional Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build and optimize your candidate metadata vector.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-1.5 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-neonPurple to-neonIndigo text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-neonPurple/10"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Main Profile & Personal Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Avatar & Socials */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-between text-center lg:col-span-1">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-neonPurple relative bg-slate-900 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-slate-500" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-neonPurple p-2.5 rounded-full border border-glassBorder cursor-pointer text-white hover:bg-neonPurple/90 transition-all">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>

          <h3 className="text-lg font-bold text-white mt-4">{formData.full_name || "New Candidate"}</h3>
          <p className="text-xs text-neonCyan font-semibold uppercase mt-0.5 tracking-wider">
            {formData.industry || "General Industry"}
          </p>
          
          <div className="w-full bg-glassBorder h-px my-6"></div>

          {/* Social Links */}
          <div className="w-full space-y-4 text-left">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Social Vectors</h4>
            
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">LN</span>
                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={formData.social_links.linkedin}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value }
                  })}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neonPurple"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">GH</span>
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={formData.social_links.github}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, github: e.target.value }
                  })}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neonPurple"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">PT</span>
                <input
                  type="text"
                  placeholder="Portfolio URL"
                  value={formData.social_links.portfolio}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, portfolio: e.target.value }
                  })}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neonPurple"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Personal Profile Inputs */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-neonPurple" />
            Biographical Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Years of Experience</label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Salary ($)</label>
              <input
                type="number"
                value={formData.target_salary}
                onChange={(e) => setFormData({ ...formData, target_salary: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Professional Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={4}
              className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-neonPurple"
            />
          </div>
        </div>
      </div>

      {/* Relational Sections (Skills, Education, Experience, Certifications, Projects) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SKILLS */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-neonPurple" />
              Technical Competencies
            </h3>
            <button onClick={addSkill} className="p-1 rounded-lg bg-neonPurple/10 text-neonPurple border border-neonPurple/20 hover:bg-neonPurple/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {skills.map((skill, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="e.g. React"
                  value={skill.name}
                  onChange={(e) => {
                    const next = [...skills]
                    next[index].name = e.target.value
                    setSkills(next)
                  }}
                  className="flex-1 bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                />
                <select
                  value={skill.proficiency}
                  onChange={(e) => {
                    const next = [...skills]
                    next[index].proficiency = e.target.value
                    setSkills(next)
                  }}
                  className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <button onClick={() => removeSkill(index)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PROJECTS */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-neonPurple" />
              Portfolios & Projects
            </h3>
            <button onClick={addProject} className="p-1 rounded-lg bg-neonPurple/10 text-neonPurple border border-neonPurple/20 hover:bg-neonPurple/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {projects.map((proj, index) => (
              <div key={index} className="p-4 bg-slate-950/40 border border-glassBorder rounded-xl space-y-3 relative">
                <button onClick={() => removeProject(index)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => {
                      const next = [...projects]
                      next[index].title = e.target.value
                      setProjects(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                  <input
                    type="text"
                    placeholder="Project Link"
                    value={proj.link}
                    onChange={(e) => {
                      const next = [...projects]
                      next[index].link = e.target.value
                      setProjects(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                </div>
                <textarea
                  placeholder="Project description..."
                  value={proj.description}
                  onChange={(e) => {
                    const next = [...projects]
                    next[index].description = e.target.value
                    setProjects(next)
                  }}
                  rows={2}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                />
              </div>
            ))}
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-neonPurple" />
              Work Experience History
            </h3>
            <button onClick={addExperience} className="p-1 rounded-lg bg-neonPurple/10 text-neonPurple border border-neonPurple/20 hover:bg-neonPurple/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index} className="p-4 bg-slate-950/40 border border-glassBorder rounded-xl space-y-3 relative">
                <button onClick={() => removeExperience(index)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => {
                      const next = [...experience]
                      next[index].company = e.target.value
                      setExperience(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Developer)"
                    value={exp.role}
                    onChange={(e) => {
                      const next = [...experience]
                      next[index].role = e.target.value
                      setExperience(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                  <input
                    type="text"
                    placeholder="Start Year (e.g. 2021)"
                    value={exp.start_date}
                    onChange={(e) => {
                      const next = [...experience]
                      next[index].start_date = e.target.value
                      setExperience(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                  <input
                    type="text"
                    placeholder="End Year (or Present)"
                    value={exp.end_date}
                    onChange={(e) => {
                      const next = [...experience]
                      next[index].end_date = e.target.value
                      setExperience(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                </div>
                <textarea
                  placeholder="Describe your role and impact metrics..."
                  value={exp.description}
                  onChange={(e) => {
                    const next = [...experience]
                    next[index].description = e.target.value
                    setExperience(next)
                  }}
                  rows={3}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                />
              </div>
            ))}
          </div>
        </div>

        {/* EDUCATION */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-neonPurple" />
              Academic Credentials
            </h3>
            <button onClick={addEducation} className="p-1 rounded-lg bg-neonPurple/10 text-neonPurple border border-neonPurple/20 hover:bg-neonPurple/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="p-4 bg-slate-950/40 border border-glassBorder rounded-xl space-y-3 relative">
                <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Institution/University"
                  value={edu.institution}
                  onChange={(e) => {
                    const next = [...education]
                    next[index].institution = e.target.value
                    setEducation(next)
                  }}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Degree (e.g. Master)"
                    value={edu.degree}
                    onChange={(e) => {
                      const next = [...education]
                      next[index].degree = e.target.value
                      setEducation(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={edu.field_of_study}
                    onChange={(e) => {
                      const next = [...education]
                      next[index].field_of_study = e.target.value
                      setEducation(next)
                    }}
                    className="bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CERTIFICATIONS */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-neonPurple" />
              Certifications & Badges
            </h3>
            <button onClick={addCert} className="p-1 rounded-lg bg-neonPurple/10 text-neonPurple border border-neonPurple/20 hover:bg-neonPurple/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {certifications.map((cert, index) => (
              <div key={index} className="p-4 bg-slate-950/40 border border-glassBorder rounded-xl space-y-3 relative">
                <button onClick={() => removeCert(index)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => {
                    const next = [...certifications]
                    next[index].name = e.target.value
                    setCertifications(next)
                  }}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                />
                <input
                  type="text"
                  placeholder="Issuing Org (e.g. AWS)"
                  value={cert.issuing_organization}
                  onChange={(e) => {
                    const next = [...certifications]
                    next[index].issuing_organization = e.target.value
                    setCertifications(next)
                  }}
                  className="w-full bg-slate-950/60 border border-glassBorder rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-neonPurple"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
