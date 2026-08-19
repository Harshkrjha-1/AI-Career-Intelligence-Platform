import React, { useState, useRef } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import api from "../services/api"

interface DragDropUploadProps {
  onUploadSuccess: (resumeData: any) => void
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({ onUploadSuccess }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false)
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const triggerInputClick = () => {
    fileInputRef.current?.click()
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      setUploadState("error")
      setErrorMessage("Please upload a PDF or DOCX file.")
      return
    }

    setFileName(file.name)
    setUploadState("uploading")

    const formData = new FormData()
    formData.append("file", file)

    try {
      // 1. Upload resume
      const res = await api.post("/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      
      // 2. Poll/parse (ensure parsed data generated synchronously for premium experience)
      const parseRes = await api.post("/resume/parse", null, {
        params: { resume_id: res.data.id }
      })

      setUploadState("success")
      setTimeout(() => {
        onUploadSuccess(parseRes.data)
        setUploadState("idle")
      }, 1500)
    } catch (err: any) {
      setUploadState("error")
      setErrorMessage(err.response?.data?.detail || "Failed to upload and parse resume.")
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={triggerInputClick}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-neonPurple bg-neonPurple/5 scale-[0.99] pulse-neon"
          : "border-glassBorder bg-glassBg hover:border-neonPurple/50 hover:bg-slate-900/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.doc"
        onChange={handleFileChange}
      />

      {uploadState === "idle" && (
        <>
          <div className="bg-slate-900/80 p-4 rounded-full border border-glassBorder mb-4 text-neonPurple">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>
          <p className="text-base font-semibold text-white">
            Drag & drop your resume file here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports PDF, DOCX and DOC format (Max 10MB)
          </p>
          <span className="mt-4 px-4 py-1.5 text-xs font-semibold bg-neonPurple/15 text-neonPurple rounded-full border border-neonPurple/20 hover:bg-neonPurple/25 transition-all">
            Browse Files
          </span>
        </>
      )}

      {uploadState === "uploading" && (
        <>
          <div className="text-neonCyan mb-4">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <p className="text-base font-semibold text-white">
            AI Engine is parsing your resume...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Extracting name, skills, contact and history variables
          </p>
          <p className="text-sm font-semibold text-neonCyan mt-3 animate-pulse">
            {fileName}
          </p>
        </>
      )}

      {uploadState === "success" && (
        <>
          <div className="bg-neonGreen/10 p-4 rounded-full border border-neonGreen/30 mb-4 text-neonGreen">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-white">
            Parse Completed Successfully!
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Your profile has been updated with extracted skills
          </p>
        </>
      )}

      {uploadState === "error" && (
        <>
          <div className="bg-neonPink/10 p-4 rounded-full border border-neonPink/30 mb-4 text-neonPink">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-white">
            Upload Failed
          </p>
          <p className="text-xs text-neonPink mt-1">
            {errorMessage}
          </p>
          <span className="mt-4 px-4 py-1 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
            Try Again
          </span>
        </>
      )}
    </div>
  )
}
