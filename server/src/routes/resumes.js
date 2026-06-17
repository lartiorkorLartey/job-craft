const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const uploadDir = path.join(__dirname, '../../uploads/resumes')

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
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: resumes })
  } catch (err) {
    console.error('List resumes error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch resumes' })
  }
})

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' })
  }
  try {
    const resume = await prisma.resume.create({
      data: {
        userId: req.userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    })
    res.status(201).json({ success: true, data: resume })
  } catch (err) {
    console.error('Upload resume error:', err)
    res.status(500).json({ success: false, error: 'Failed to save resume' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' })
    }
    await prisma.resume.delete({ where: { id: req.params.id } })
    fs.unlink(path.join(uploadDir, resume.filename), () => {})
    res.json({ success: true, data: null })
  } catch (err) {
    console.error('Delete resume error:', err)
    res.status(500).json({ success: false, error: 'Failed to delete resume' })
  }
})

module.exports = router
