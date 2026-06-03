require('dotenv').config()
const express   = require('express')
const mongoose  = require('mongoose')
const cors      = require('cors')
const morgan    = require('morgan')
const path      = require('path')

const app = express()

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/screening', require('./routes/screening'))
app.use('/api/upload',    require('./routes/upload'))
app.use('/api/auth',      require('./routes/auth'))

// Health
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

// DB + Start
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cv-screener')
  .then(() => {
    console.log('✅ MongoDB connected')
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`🚀 Node API running on http://localhost:${PORT}`))
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1) })
