const mongoose = require('mongoose')

const CandidateSchema = new mongoose.Schema({
  name:         String,
  email:        String,
  phone:        String,
  experience:   String,
  education:    String,
  skills:       [String],
  seniority:    { type: String, enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Unknown'], default: 'Unknown' },
  overallScore: { type: Number, default: 0 },
  isDuplicate:  { type: Boolean, default: false },
  inconsistencyFlag: { type: Boolean, default: false },
  matchDetails: {
    skillMatch:       Number,
    experienceMatch:  Number,
    educationMatch:   Number,
    domainMatch:      Number,
    projectMatch:     Number,
    strengths:        [String],
    weaknesses:       [String],
  },
  fileName:     String,
})

const ScreeningSchema = new mongoose.Schema({
  jobTitle:       { type: String, required: true },
  jobDescription: { type: String, required: true },
  cvSource:       {
    type:    { type: String, enum: ['local', 'folder', 'drive', 's3'] },
    fileIds: [String],
    folderPath: String,
    link:    String,
  },
  status:       { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  progress:     { current: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
  candidates:   [CandidateSchema],
  totalCVs:     { type: Number, default: 0 },
  topScore:     { type: Number, default: 0 },
  shortlisted:  { type: Number, default: 0 },
  error:        String,
}, { timestamps: true })

module.exports = mongoose.model('Screening', ScreeningSchema)
