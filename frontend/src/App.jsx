import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Landing } from "./pages/Landing"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Dashboard } from "./pages/Dashboard"
import { ResumeAnalysis } from "./pages/ResumeAnalysis"
import { SkillGap } from "./pages/SkillGap"
import { CareerRoadmap } from "./pages/CareerRoadmap"
import { Salary } from "./pages/Salary"
import Profile from "./pages/Profile"
import { ResumeManagement } from "./pages/ResumeManagement"
import { ResumeBuilder } from "./pages/ResumeBuilder"
import { LiveOpportunities } from "./pages/LiveOpportunities"
import { Settings } from "./pages/Settings"
import { AdminLogin } from "./pages/AdminLogin"
import { AdminDashboard } from "./pages/AdminDashboard"
import { DashboardLayout } from "./components/DashboardLayout"
import { ErrorBoundary } from "./components/ErrorBoundary"

// Client-side authentication token validation check wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token")
  return token ? children : <Navigate to="/login" replace />
}

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token")
  const isAdmin = localStorage.getItem("is_admin") === "true"
  return (token && isAdmin) ? children : <Navigate to="/admin/login" replace />
}

export const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Child Sub-Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="resume-analysis" element={<ErrorBoundary><ResumeAnalysis /></ErrorBoundary>} />
          <Route path="skill-gap" element={<ErrorBoundary><SkillGap /></ErrorBoundary>} />
          <Route path="career-roadmap" element={<ErrorBoundary><CareerRoadmap /></ErrorBoundary>} />
          <Route path="salary-insights" element={<ErrorBoundary><Salary /></ErrorBoundary>} />
          <Route path="resume-management" element={<ErrorBoundary><ResumeManagement /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>

        {/* Direct Sub-Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><Profile /></ErrorBoundary>} />
        </Route>

        <Route
          path="/resume-management"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><ResumeManagement /></ErrorBoundary>} />
        </Route>

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>

        <Route
          path="/resume-builder"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><ResumeBuilder /></ErrorBoundary>} />
        </Route>

        <Route
          path="/live-opportunities"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><LiveOpportunities /></ErrorBoundary>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            </AdminProtectedRoute>
          }
        />

        {/* Catch-all redirect to public landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App;
