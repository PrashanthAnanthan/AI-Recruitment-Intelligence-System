import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { screeningApi } from '../utils/api'
import { Trash2, ChevronRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function History() {
  const [screenings, setScreenings] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => screeningApi.getAll()
    .then(r => setScreenings(r.data.screenings || []))
    .catch(() => {})
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const del = async (id, e) => {
    e.preventDefault()
    if (!confirm('Delete this screening?')) return
    await screeningApi.delete(id).catch(() => {})
    toast.success('Deleted')
    load()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-light">Screening History</h1>
        <p className="text-muted mt-1 font-body">{screenings.length} total screenings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-accent" />
        </div>
      ) : screenings.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-muted font-body">No screenings yet.</p>
          <Link to="/screen" className="btn-primary mt-4 inline-flex">Start First Screening</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-border">
            {screenings.map((sc, i) => (
              <motion.div
                key={sc._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={`/results/${sc._id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors group">
                  <div className="flex-1">
                    <p className="text-light font-body font-medium">{sc.jobTitle}</p>
                    <p className="text-muted text-xs font-mono mt-0.5">
                      {sc.totalCVs || 0} CVs · {new Date(sc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`tag text-xs font-mono
                      ${sc.status === 'completed' ? 'tag-green' : sc.status === 'processing' ? 'tag-purple' : 'tag-red'}`}>
                      {sc.status}
                    </span>
                    <span className="text-emerald font-mono text-sm">{sc.topScore || '–'}%</span>
                    <button onClick={(e) => del(sc._id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-crimson transition-all">
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
