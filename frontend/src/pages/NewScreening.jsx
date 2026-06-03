import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Cloud, HardDrive, FolderOpen, Link2,
  Loader2, ChevronRight, X, File, Check
} from 'lucide-react'
import { screeningApi, uploadApi } from '../utils/api'
import { useScreening } from '../context/ScreeningContext'

const TABS = [
  { id: 'local',  label: 'Local Files',   icon: HardDrive },
  { id: 'pick',   label: 'Select Folder', icon: FolderOpen },
  { id: 'folder', label: 'Folder Path',   icon: FolderOpen },
  { id: 'drive',  label: 'Google Drive',  icon: Cloud },
  { id: 's3',     label: 'AWS S3',        icon: FolderOpen },
]

export default function NewScreening() {
  const navigate = useNavigate()
  const { setIsProcessing } = useScreening()

  const [tab, setTab] = useState('local')
  const [jd, setJd] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [files, setFiles] = useState([])
  const [driveLink, setDriveLink] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [pickedFiles, setPickedFiles] = useState([])
  const [pickedFolderName, setPickedFolderName] = useState('')
  const [s3Config, setS3Config] = useState({ bucket: '', prefix: '', region: 'us-east-1' })
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [step, setStep] = useState(1) // 1=JD, 2=CVs, 3=Submit

  const onDrop = useCallback(accepted => {
    const valid = accepted.filter(f =>
      f.type === 'application/pdf' ||
      f.name.endsWith('.docx') ||
      f.name.endsWith('.doc')
    )
    setFiles(prev => [...prev, ...valid])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: true, accept: { 'application/pdf': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] }
  })

  const removeFile = i => setFiles(f => f.filter((_, idx) => idx !== i))

  const pickFolder = async () => {
    if (!window.showDirectoryPicker) {
      toast.error('Folder picking needs Chrome or Edge browser')
      return
    }
    try {
      const dirHandle = await window.showDirectoryPicker()
      setPickedFolderName(dirHandle.name)
      const collected = []
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && /\.(pdf|docx|doc)$/i.test(entry.name)) {
          const file = await entry.getFile()
          collected.push(file)
        }
      }
      if (collected.length === 0) {
        toast.error('No PDF/DOCX files found in that folder')
        return
      }
      setPickedFiles(collected)
      toast.success(`${collected.length} CV(s) found in folder`)
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Could not read folder')
    }
  }

  const handleSubmit = async () => {
    if (!jd.trim() || jd.length < 50) { toast.error('Please enter a detailed job description'); return }
    if (!jobTitle.trim()) { toast.error('Please enter a job title'); return }

    setUploading(true)
    setIsProcessing(true)

    try {
      let cvSource = {}

      if (tab === 'local') {
        if (files.length === 0) { toast.error('Please upload at least one CV'); setUploading(false); return }
        const fd = new FormData()
        files.forEach(f => fd.append('cvs', f))
        const r = await uploadApi.uploadCVs(fd, pct => setUploadPct(pct))
        cvSource = { type: 'local', fileIds: r.data.fileIds }
      } else if (tab === 'pick') {
        if (pickedFiles.length === 0) { toast.error('Please select a folder first'); setUploading(false); return }
        const fd = new FormData()
        pickedFiles.forEach(f => fd.append('cvs', f))
        const r = await uploadApi.uploadCVs(fd, pct => setUploadPct(pct))
        cvSource = { type: 'local', fileIds: r.data.fileIds }
      } else if (tab === 'folder') {
        if (!folderPath) { toast.error('Please enter a folder path'); setUploading(false); return }
        const r = await uploadApi.fromFolder(folderPath)
        cvSource = { type: 'folder', folderPath: r.data.folderPath }
      } else if (tab === 'drive') {
        if (!driveLink) { toast.error('Please enter a Google Drive link'); setUploading(false); return }
        const r = await uploadApi.fromDrive(driveLink)
        cvSource = { type: 'drive', ...r.data }
      } else {
        if (!s3Config.bucket) { toast.error('Please enter an S3 bucket name'); setUploading(false); return }
        const r = await uploadApi.fromS3(s3Config)
        cvSource = { type: 's3', ...r.data }
      }

      const res = await screeningApi.create({ jobTitle, jobDescription: jd, cvSource })
      toast.success('Screening started!')
      navigate(`/results/${res.data.screeningId}`)
    } catch (e) {
      toast.error(e.message || 'Something went wrong')
      setIsProcessing(false)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-light">New Screening</h1>
        <p className="text-muted mt-1 font-body">Set up your job description and upload CVs</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Job Description', 'Upload CVs', 'Review & Run'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i + 1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono transition-all
                ${step === i + 1 ? 'bg-accent text-white' : step > i + 1 ? 'bg-emerald/20 text-emerald' : 'text-muted'}`}
            >
              {step > i + 1 ? <Check size={13} /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < 2 && <ChevronRight size={14} className="text-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Job Description */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-6 space-y-5">
              <div>
                <label className="block text-sm text-muted mb-2 font-body">Job Title *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Senior Python Developer"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-2 font-body">
                  Job Description * <span className="font-mono text-xs">({jd.length} chars)</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={14}
                  placeholder="Paste the full job description here. Include required skills, experience, responsibilities, and qualifications for best results..."
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                />
              </div>
              <button
                onClick={() => { if (!jobTitle || jd.length < 50) { toast.error('Fill in both fields'); return } setStep(2) }}
                className="btn-primary w-full"
              >
                Continue to CV Upload →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Upload CVs */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-6 space-y-5">
              {/* Source Tabs */}
              <div className="flex gap-2 flex-wrap">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all font-body
                      ${tab === id ? 'bg-accent/15 text-accent-glow border border-accent/30' : 'text-muted hover:text-light border border-border'}`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {/* Local */}
              {tab === 'local' && (
                <div>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                      ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-white/2'}`}
                  >
                    <input {...getInputProps()} />
                    <Upload size={32} className="mx-auto mb-3 text-muted" />
                    <p className="text-light font-body">Drop PDF/DOCX files here</p>
                    <p className="text-muted text-sm mt-1">or click to browse · Supports 1000+ CVs</p>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-surface rounded-xl border border-border">
                          <div className="flex items-center gap-2">
                            <File size={13} className="text-accent" />
                            <span className="text-sm text-light font-mono truncate max-w-xs">{f.name}</span>
                          </div>
                          <button onClick={() => removeFile(i)} className="text-muted hover:text-crimson transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {files.length > 0 && (
                    <p className="text-xs text-emerald font-mono mt-2">{files.length} file(s) selected</p>
                  )}
                </div>
              )}

              {/* Select Folder (browser picker — works online) */}
              {tab === 'pick' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald/5 border border-emerald/20 text-sm text-emerald font-body">
                    Click below, choose a folder, and allow access. The system reads every PDF/DOCX inside automatically. Works online (Chrome/Edge).
                  </div>
                  <button onClick={pickFolder} className="btn-ghost w-full flex items-center justify-center gap-2">
                    <FolderOpen size={16} /> Select Folder
                  </button>
                  {pickedFiles.length > 0 && (
                    <p className="text-xs text-emerald font-mono">
                      📁 {pickedFolderName} — {pickedFiles.length} CV(s) ready
                    </p>
                  )}
                </div>
              )}

              {/* Folder Path */}
              {tab === 'folder' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber/5 border border-amber/20 text-sm text-amber font-body">
                    ⚠️ Folder Path only works when running this app on your own computer (local mode).
                    On the live website it cannot read your computer's folders for security reasons —
                    please use the <strong>"Select Folder"</strong> tab instead, which works everywhere.
                  </div>
                  <input
                    className="input-field"
                    placeholder="C:\Users\User\Documents\G_CV"
                    value={folderPath}
                    onChange={e => setFolderPath(e.target.value)}
                  />
                  <p className="text-xs text-muted font-body">
                    Tip: This option is mainly for local testing. For online use, the "Select Folder" tab gives the same result.
                  </p>
                </div>
              )}

              {/* Google Drive */}
              {tab === 'drive' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber/5 border border-amber/20 text-sm text-amber font-body">
                    Share a Google Drive folder link (set to "Anyone with the link can view")
                  </div>
                  <input
                    className="input-field"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveLink}
                    onChange={e => setDriveLink(e.target.value)}
                  />
                </div>
              )}

              {/* S3 */}
              {tab === 's3' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted mb-1.5 block font-body">Bucket Name *</label>
                      <input className="input-field" placeholder="my-cv-bucket"
                        value={s3Config.bucket} onChange={e => setS3Config(p => ({ ...p, bucket: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1.5 block font-body">Region</label>
                      <input className="input-field" placeholder="us-east-1"
                        value={s3Config.region} onChange={e => setS3Config(p => ({ ...p, region: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1.5 block font-body">Prefix / Folder (optional)</label>
                    <input className="input-field" placeholder="cvs/2024/"
                      value={s3Config.prefix} onChange={e => setS3Config(p => ({ ...p, prefix: e.target.value }))} />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue to Review →</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-6 space-y-5">
              <h3 className="font-display font-semibold text-light">Review & Launch</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted text-sm font-body">Job Title</span>
                  <span className="text-light font-mono text-sm">{jobTitle}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted text-sm font-body">JD Length</span>
                  <span className="text-emerald font-mono text-sm">{jd.length} characters</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted text-sm font-body">CV Source</span>
                  <span className="tag-purple font-mono text-xs">
                    {tab === 'local' ? `${files.length} local files`
                      : tab === 'pick' ? `${pickedFiles.length} files (folder)`
                      : tab === 'folder' ? 'Folder Path'
                      : tab === 'drive' ? 'Google Drive' : 'AWS S3'}
                  </span>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-muted">
                    <span>Uploading & processing…</span>
                    <span>{uploadPct}%</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill bg-accent" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost" disabled={uploading}>← Back</button>
                <button onClick={handleSubmit} disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : '🚀 Run AI Screening'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
