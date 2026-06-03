const router   = require('express').Router()
const asyncHandler = require('express-async-handler')
const axios    = require('axios')
const ExcelJS  = require('exceljs')
const PDFKit   = require('pdfkit')
const Screening = require('../models/Screening')

const PYTHON = process.env.PYTHON_API_URL || 'http://localhost:8000'

// GET all screenings
router.get('/', asyncHandler(async (req, res) => {
  const screenings = await Screening.find({}, 'jobTitle status totalCVs topScore shortlisted createdAt')
    .sort({ createdAt: -1 }).limit(50)
  res.json({ screenings })
}))

// GET single screening
router.get('/:id', asyncHandler(async (req, res) => {
  const sc = await Screening.findById(req.params.id)
  if (!sc) return res.status(404).json({ message: 'Not found' })
  res.json(sc)
}))

// POST create & trigger processing
router.post('/', asyncHandler(async (req, res) => {
  const { jobTitle, jobDescription, cvSource } = req.body
  if (!jobTitle || !jobDescription) return res.status(400).json({ message: 'Missing fields' })

  const sc = await Screening.create({ jobTitle, jobDescription, cvSource, status: 'pending' })

  // Fire-and-forget to Python engine
  axios.post(`${PYTHON}/process`, {
    screeningId:    sc._id.toString(),
    jobTitle,
    jobDescription,
    cvSource,
  }).catch(err => {
    console.error('Python engine error:', err.message)
    Screening.findByIdAndUpdate(sc._id, { status: 'failed', error: err.message }).exec()
  })

  res.status(201).json({ screeningId: sc._id })
}))

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  await Screening.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
}))

// Export Excel
router.get('/:id/export/xlsx', asyncHandler(async (req, res) => {
  const sc = await Screening.findById(req.params.id)
  if (!sc) return res.status(404).json({ message: 'Not found' })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Results')

  ws.columns = [
    { header: 'Rank',       key: 'rank',       width: 8  },
    { header: 'Name',       key: 'name',       width: 25 },
    { header: 'Score',      key: 'score',      width: 10 },
    { header: 'Seniority',  key: 'seniority',  width: 12 },
    { header: 'Skills',     key: 'skills',     width: 40 },
    { header: 'Experience', key: 'experience', width: 30 },
    { header: 'Education',  key: 'education',  width: 30 },
    { header: 'Strengths',  key: 'strengths',  width: 50 },
    { header: 'Weaknesses', key: 'weaknesses', width: 50 },
    { header: 'Duplicate',  key: 'duplicate',  width: 10 },
  ]

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C63FF' } }

  sc.candidates.forEach((c, i) => {
    ws.addRow({
      rank:       i + 1,
      name:       c.name,
      score:      c.overallScore,
      seniority:  c.seniority,
      skills:     (c.skills || []).join(', '),
      experience: c.experience,
      education:  c.education,
      strengths:  (c.matchDetails?.strengths || []).join('; '),
      weaknesses: (c.matchDetails?.weaknesses || []).join('; '),
      duplicate:  c.isDuplicate ? 'Yes' : 'No',
    })
    const row = ws.getRow(i + 2)
    row.getCell('score').font = { color: { argb: c.overallScore >= 75 ? 'FF00D4AA' : c.overallScore >= 50 ? 'FFFFB347' : 'FFFF4D6D' }, bold: true }
  })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="screening-${sc._id}.xlsx"`)
  await wb.xlsx.write(res)
  res.end()
}))

// Export PDF
router.get('/:id/export/pdf', asyncHandler(async (req, res) => {
  const sc = await Screening.findById(req.params.id)
  if (!sc) return res.status(404).json({ message: 'Not found' })

  const doc = new PDFKit({ margin: 40 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="screening-${sc._id}.pdf"`)
  doc.pipe(res)

  doc.fontSize(20).fillColor('#6C63FF').text('AI CV Screening Results', { align: 'center' })
  doc.fontSize(12).fillColor('#888').text(`Job: ${sc.jobTitle}`, { align: 'center' })
  doc.moveDown()

  sc.candidates.forEach((c, i) => {
    doc.fontSize(13).fillColor('#333').text(`${i + 1}. ${c.name || 'Unknown'} — ${c.overallScore}/100`)
    doc.fontSize(10).fillColor('#666').text(`  ${c.experience || ''} | ${c.education || ''}`)
    if (c.matchDetails?.strengths?.length)
      doc.fillColor('#00AA88').text(`  ✓ ${c.matchDetails.strengths.slice(0, 2).join('; ')}`)
    if (c.matchDetails?.weaknesses?.length)
      doc.fillColor('#CC4466').text(`  ✗ ${c.matchDetails.weaknesses.slice(0, 2).join('; ')}`)
    doc.moveDown(0.5)
  })

  doc.end()
}))

module.exports = router
