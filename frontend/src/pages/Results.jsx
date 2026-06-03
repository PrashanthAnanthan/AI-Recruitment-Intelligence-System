import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, CheckCircle, XCircle, Download, FileSpreadsheet,
  FileText, ChevronDown, ChevronUp, Loader2, RefreshCw,
  User, Briefcase, GraduationCap, Star, AlertTriangle
} from 'lucide-react'
import { screeningApi } from '../utils/api'
import toast from 'react-hot-toast'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const MEDAL = ['🥇', '🥈', '🥉']

function ScoreRing({ score, size = 64 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#00D4AA' : score >= 50 ? '#FFB347' : '#FF4D6D'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2A38" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" fill={color}
        style={{ transform: `rotate(90deg) translate(0, 0)`, fontSize: 14, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
      />
    </svg>
  )
}

function CandidateCard({ candidate, rank, isOpen, onToggle }) {
  const { name, overallScore, skills, experience, education, matchDetails } = candidate
  const isGood = overallScore >= 70

  const radarData = [
    { subject: 'Skills',      value: matchDetails?.skillMatch     || 0 },
    { subject: 'Experience',  value: matchDetails?.experienceMatch || 0 },
    { subject: 'Education',   value: matchDetails?.educationMatch  || 0 },
    { subject: 'Domain',      value: matchDetails?.domainMatch     || 0 },
    { subject: 'Projects',    value: matchDetails?.projectMatch    || 0 },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={`card overflow-hidden border ${isOpen ? 'border-accent/40' : 'border-border'}`}
    >
      {/* Header row */}
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors">
        <span className="text-xl w-7 shrink-0">{MEDAL[rank] || `#${rank + 1}`}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-semibold text-light">{name || 'Unknown Candidate'}</p>
            <span className={`tag text-xs ${isGood ? 'tag-green' : 'tag-amber'}`}>
              {isGood ? 'Strong Match' : 'Partial Match'}
            </span>
            {candidate.seniority && <span className="tag tag-purple">{candidate.seniority}</span>}
          </div>
          <p className="text-xs text-muted font-mono mt-0.5 truncate">
            {experience} · {education}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-mono font-bold ${
              overallScore >= 75 ? 'text-emerald' :
              overallScore >= 50 ? 'text-amber' : 'text-crimson'
            }`}>{overallScore}<span className="text-sm">/100</span></p>
          </div>
          {isOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4">
              <div className="grid grid-cols-3 gap-5">
                {/* Score breakdown bars */}
                <div className="col-span-2 space-y-3">
                  <h4 className="font-display font-semibold text-sm text-light mb-3">Score Breakdown</h4>
                  {radarData.map(({ subject, value }) => (
                    <div key={subject}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted font-body">{subject}</span>
                        <span className="font-mono text-light">{value}%</span>
                      </div>
                      <div className="score-bar">
                        <div
                          className={`score-fill ${value >= 70 ? 'bg-emerald' : value >= 45 ? 'bg-amber' : 'bg-crimson'}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Radar */}
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#2A2A38" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B6B8A', fontSize: 10, fontFamily: 'DM Sans' }} />
                      <Radar dataKey="value" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.15} strokeWidth={1.5} />
                      <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2A2A38', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <h5 className="flex items-center gap-2 text-emerald text-xs font-display font-semibold mb-2">
                    <CheckCircle size={13} /> Why this candidate is GOOD
                  </h5>
                  <ul className="space-y-1.5">
                    {(matchDetails?.strengths || []).map((s, i) => (
                      <li key={i} className="text-xs text-light font-body flex gap-1.5">
                        <span className="text-emerald">•</span> {s}
                      </li>
                    ))}
                    {(!matchDetails?.strengths?.length) && <li className="text-xs text-muted">No strengths extracted</li>}
                  </ul>
                </div>
                <div>
                  <h5 className="flex items-center gap-2 text-crimson text-xs font-display font-semibold mb-2">
                    <XCircle size={13} /> Why NOT perfect
                  </h5>
                  <ul className="space-y-1.5">
                    {(matchDetails?.weaknesses || []).map((w, i) => (
                      <li key={i} className="text-xs text-light font-body flex gap-1.5">
                        <span className="text-crimson">•</span> {w}
                      </li>
                    ))}
                    {(!matchDetails?.weaknesses?.length) && <li className="text-xs text-muted">No gaps found</li>}
                  </ul>
                </div>
              </div>

              {/* Skills */}
              {skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted mb-2 font-body">Extracted Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((sk, i) => (
                      <span key={i} className="tag-purple text-xs">{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Flags */}
              <div className="flex gap-2 mt-4">
                {candidate.isDuplicate && <span className="tag-amber"><AlertTriangle size={11} /> Possible Duplicate</span>}
                {candidate.inconsistencyFlag && <span className="tag-red"><AlertTriangle size={11} /> Inconsistency Detected</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Results() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openCard, setOpenCard] = useState(0)
  const [filter, setFilter] = useState('all')
  const [exporting, setExporting] = useState(null)
  const pollRef = useRef(null)

  const load = async () => {
    try {
      const r = await screeningApi.getById(id)
      setData(r.data)
      if (r.data.status === 'completed' || r.data.status === 'failed') {
        clearInterval(pollRef.current)
      }
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 4000)
    return () => clearInterval(pollRef.current)
  }, [id])

  const handleExport = async (type) => {
    setExporting(type)
    try {
      const r = type === 'xlsx'
        ? await screeningApi.exportXLS(id)
        : await screeningApi.exportPDF(id)
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href = url
      a.download = `screening-results.${type}`; a.click()
      toast.success(`${type.toUpperCase()} exported!`)
    } catch (e) { toast.error(e.message) }
    finally { setExporting(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-accent" />
    </div>
  )

  const candidates = data?.candidates || []
  const filtered = filter === 'top10' ? candidates.slice(0, 10)
    : filter === 'hire' ? candidates.filter(c => c.overallScore >= 75)
    : candidates

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-light">{data?.jobTitle}</h1>
          <p className="text-muted mt-1 font-body">
            {candidates.length} candidates · {data?.status === 'processing' ? 'Processing…' : 'Completed'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('xlsx')} disabled={!!exporting} className="btn-ghost flex items-center gap-2 text-sm">
            {exporting === 'xlsx' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="btn-ghost flex items-center gap-2 text-sm">
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            PDF
          </button>
        </div>
      </div>

      {/* Processing banner */}
      {(data?.status === 'processing' || data?.status === 'pending') && (
        <div className="card p-4 mb-6 flex items-center gap-3 border-accent/30 bg-accent/5">
          <Loader2 size={16} className="animate-spin text-accent" />
          <div>
            <p className="text-light text-sm font-body">AI is analyzing CVs…</p>
            <p className="text-muted text-xs font-mono">{data?.progress?.current || 0} / {data?.progress?.total || '?'} processed</p>
          </div>
          <div className="flex-1">
            <div className="score-bar">
              <div className="score-fill bg-accent animate-pulse-glow"
                style={{ width: `${data?.progress?.total ? (data.progress.current / data.progress.total) * 100 : 30}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {[['all', 'All Candidates'], ['top10', 'Top 10'], ['hire', 'Hire Recommended (75+)']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm transition-all font-body
              ${filter === val ? 'bg-accent/15 text-accent-glow border border-accent/30' : 'text-muted border border-border hover:text-light'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            ['Top Score', `${candidates[0]?.overallScore || 0}%`, 'text-emerald'],
            ['Avg Score', `${Math.round(candidates.reduce((s, c) => s + c.overallScore, 0) / candidates.length)}%`, 'text-accent'],
            ['Strong Matches', candidates.filter(c => c.overallScore >= 75).length, 'text-amber'],
            ['Duplicates', candidates.filter(c => c.isDuplicate).length, 'text-crimson'],
          ].map(([label, value, color]) => (
            <div key={label} className="card p-4 text-center">
              <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-muted text-xs mt-1 font-body">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Candidate cards */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center text-muted font-body">
          {data?.status === 'processing' ? 'Results loading…' : 'No candidates found'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <CandidateCard
              key={c._id || i}
              candidate={c}
              rank={i}
              isOpen={openCard === i}
              onToggle={() => setOpenCard(openCard === i ? -1 : i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
