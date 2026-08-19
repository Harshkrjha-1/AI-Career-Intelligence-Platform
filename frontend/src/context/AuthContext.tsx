import React, { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"

interface UserProfile {
  id: number
  user_id: number
  full_name: string
  photo_url: string | null
  location: string | null
  industry: string | null
}

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: str, password: str) => Promise<void>
  register: (email: str, password: str) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = async () => {
    try {
      const res = await api.get("/profile")
      setUser(res.data)
      setIsAuthenticated(true)
    } catch (err) {
      // Clear credentials
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token")
    if (accessToken) {
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: str, password: str) => {
    setIsLoading(true)
    try {
      const res = await api.post("/auth/login", { email, password })
      localStorage.setItem("access_token", res.data.access_token)
      localStorage.setItem("refresh_token", res.data.refresh_token)
      await refreshUser()
    } catch (err) {
      setIsLoading(false)
      throw err;
    }
  }

  const register = async (email: str, password: str) => {
    setIsLoading(true)
    try {
      await api.post("/auth/register", { email, password })
      // Auto login after registration
      await login(email, password)
    } catch (err) {
      setIsLoading(false)
      throw err;
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
// Clean typing helper for typescript string parameter
type str = string
