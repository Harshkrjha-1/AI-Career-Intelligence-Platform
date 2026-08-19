import React from "react"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend
} from "recharts"

interface RadarChartProps {
  data: { skill: string; current: number; target: number }[]
}

export const SkillsRadarChart: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b" }} />
          <Radar
            name="Current Level"
            dataKey="current"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.25}
          />
          <Radar
            name="Market Standard"
            dataKey="target"
            stroke="#22d3ee"
            fill="#22d3ee"
            fillOpacity={0.15}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff"
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface GrowthChartProps {
  data: { year: string; probability: number; baseline: number }[]
}

export const CareerGrowthChart: React.FC<GrowthChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff"
            }}
          />
          <Area
            type="monotone"
            dataKey="probability"
            name="My Trajectory ($)"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorProb)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="baseline"
            name="Market Avg ($)"
            stroke="#22d3ee"
            fillOpacity={0}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SalaryTrendProps {
  data: { location: string; average: number; target: number }[]
}

export const SalaryTrendChart: React.FC<SalaryTrendProps> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="location" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar dataKey="average" name="Global Average ($)" fill="rgba(168, 85, 247, 0.4)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" name="Target Salary ($)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
