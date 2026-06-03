import { NavLink, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, FilePlus, History, Github, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const nav = [
  { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { to: '/screen',  label: 'New Screening', icon: FilePlus },
  { to: '/history', label: 'History',   icon: History },
]

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Brain size={18} className="text-accent-glow" />
            </div>
            <div>
              <p className="font-display font-bold text-light text-sm leading-none">CV Screener</p>
              <p className="text-muted text-xs mt-0.5 font-mono">AI Recruitment</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm
                 ${isActive
                   ? 'bg-accent/15 text-accent-glow border border-accent/20'
                   : 'text-muted hover:text-light hover:bg-white/5'
                 }`
              }
            >
              <Icon size={16} />
              <span className="font-body">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/20">
            <Zap size={13} className="text-emerald" />
            <span className="text-xs text-emerald font-mono">AI Engine Online</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
