import React from "react"
import { AlertTriangle } from "lucide-react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-4 max-w-xl mx-auto mt-12 shadow-2xl">
          <div className="flex items-center space-x-2.5 text-red-400 border-b border-red-500/10 pb-3">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <h3 className="text-base font-extrabold uppercase tracking-widest">Interface Render Interrupted</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            The workspace encountered a component-level exception during render. Fallback parameters have been activated to keep layout coordinates active.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
            >
              Reset Session
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false })
              }}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
            >
              Dismiss warning
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary;
