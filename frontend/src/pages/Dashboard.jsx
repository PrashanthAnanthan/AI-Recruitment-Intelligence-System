import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus, Users, TrendingUp, Clock, ChevronRight, Award } from 'lucide-react'
import { screeningApi } from '../utils/api'
import { motion } from 'framer-motion'

const StatCard = ({ label, value, sub, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="card p-6"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted text-sm font-body">{label}</p>
        <p className="text-3xl font-display font-bold text-light mt-1">{value}</p>
        {sub && <p className="text-xs text-muted mt-1 font-mono">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
    </div>
  </motion.div>
)

export default function Dashboard() {
  const [screenings, setScreenings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    screeningApi.getAll()
      .then(r => setScreenings(r.data.screenings || []))
      .catch(() => setScreenings([]))
      .finally(() => setLoading(false))
  }, [])

  const totalCVs   = screenings.reduce((s, sc) => s + (sc.totalCVs || 0), 0)
  const avgScore   = screenings.length
    ? Math.round(screenings.reduce((s, sc) => s + (sc.topScore || 0), 0) / screenings.length)
    : 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-display text-4xl font-bold text-light"
        >
          Recruitment Intelligence
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted mt-2 font-body"
        >
          AI-powered CV screening, ranking and analysis
        </motion.p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Screenings" value={screenings.length} icon={Clock}       color="bg-accent/10 text-accent-glow"  delay={0.0} />
        <StatCard label="CVs Processed"    value={totalCVs}          icon={Users}       color="bg-emerald/10 text-emerald"     delay={0.05} />
        <StatCard label="Avg Top Score"    value={`${avgScore}%`}    icon={TrendingUp}  color="bg-amber/10 text-amber"         delay={0.1} />
        <StatCard label="Shortlisted"      value={screenings.reduce((s,sc)=>s+(sc.shortlisted||0),0)} icon={Award} color="bg-crimson/10 text-crimson" delay={0.15} />
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-light">Start a New Screening</h2>
            <p className="text-muted mt-1 font-body max-w-md">
              Upload CVs from local files, Google Drive, or AWS S3. Get AI-ranked results in minutes.
            </p>
          </div>
          <Link to="/screen" className="btn-primary flex items-center gap-2 shrink-0">
            <FilePlus size={16} />
            New Screening
          </Link>
        </div>
      </motion.div>

      {/* Recent */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-light">Recent Screenings</h3>
          <Link to="/history" className="text-sm text-accent hover:text-accent-glow font-mono">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted font-body">Loading…</div>
        ) : screenings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted font-body">No screenings yet.</p>
            <Link to="/screen" className="text-accent text-sm mt-2 inline-block hover:underline">
              Create your first →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {screenings.slice(0, 5).map((sc, i) => (
              <Link
                key={sc._id}
                to={`/results/${sc._id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors group"
              >
                <div>
                  <p className="font-body text-light text-sm font-medium">{sc.jobTitle}</p>
                  <p className="text-muted text-xs mt-0.5 font-mono">
                    {sc.totalCVs} CVs · {new Date(sc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-emerald text-sm font-mono font-semibold">{sc.topScore || '–'}%</p>
                    <p className="text-muted text-xs">top match</p>
                  </div>
                  <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
