const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const uploadDir = path.join(__dirname, '../../uploads/jobs')

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'))
    }
  },
})

router.get('/', requireAuth, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: jobs })
  } catch (err) {
    console.error('List jobs error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch job descriptions' })
  }
})

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const { title, text, url } = req.body
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' })
  }
  if (!text && !url && !req.file) {
    return res.status(400).json({ success: false, error: 'Provide text, a URL, or a file' })
  }

  let resolvedText = text || null

  // If a URL was given without pasted text, try to fetch and strip HTML now so it's ready for generation
  if (url && !text) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await response.text()
      resolvedText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50000)
    } catch {
      // Store the URL; text extraction will be attempted again at generation time
    }
  }

  try {
    const job = await prisma.job.create({
      data: {
        userId: req.userId,
        title,
        text: resolvedText,
        url: url || null,
        filename: req.file?.filename || null,
      },
    })
    res.status(201).json({ success: true, data: job })
  } catch (err) {
    console.error('Create job error:', err)
    res.status(500).json({ success: false, error: 'Failed to save job description' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' })
    }
    await prisma.job.delete({ where: { id: req.params.id } })
    if (job.filename) {
      fs.unlink(path.join(uploadDir, job.filename), () => {})
    }
    res.json({ success: true, data: null })
  } catch (err) {
    console.error('Delete job error:', err)
    res.status(500).json({ success: false, error: 'Failed to delete job description' })
  }
})

module.exports = router
