const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()

// Ensure upload directories exist at startup
;['resumes', 'jobs'].forEach((dir) => {
  fs.mkdirSync(path.join(__dirname, '../uploads', dir), { recursive: true })
})

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/resumes', require('./routes/resumes'))
app.use('/api/jobs', require('./routes/jobs'))
app.use('/api/applications', require('./routes/applications'))
app.use('/api/generator', require('./routes/generator'))

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
