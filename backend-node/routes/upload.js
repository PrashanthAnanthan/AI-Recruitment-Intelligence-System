const router   = require('express').Router()
const asyncHandler = require('express-async-handler')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
})

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const ok = /\.(pdf|docx|doc)$/i.test(file.originalname)
    cb(null, ok)
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
})

// Local upload
router.post('/cvs', upload.array('cvs', 1000), asyncHandler(async (req, res) => {
  const fileIds = req.files.map(f => f.filename)
  res.json({ fileIds, count: fileIds.length })
}))

// Google Drive
router.post('/drive', asyncHandler(async (req, res) => {
  const { link } = req.body
  if (!link) return res.status(400).json({ message: 'No link provided' })
  // Pass the link to Python for processing via Google Drive API
  // Python engine handles auth + file download
  res.json({ link, source: 'drive', message: 'Drive link received — Python engine will process' })
}))

// AWS S3
router.post('/s3', asyncHandler(async (req, res) => {
  const { bucket, prefix = '', region = 'us-east-1' } = req.body
  if (!bucket) return res.status(400).json({ message: 'Bucket name required' })

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    }
  })

  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }))
  const cvFiles = (list.Contents || [])
    .filter(o => /\.(pdf|docx|doc)$/i.test(o.Key))
    .map(o => o.Key)

  res.json({ bucket, prefix, region, keys: cvFiles, count: cvFiles.length })
}))

module.exports = router
