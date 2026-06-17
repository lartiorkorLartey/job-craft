const router = require('express').Router()
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const VALID_STATUSES = [
  'Applied',
  'Phone Screen',
  'Technical Interview',
  'Onsite',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
]

router.get('/', requireAuth, async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: applications })
  } catch (err) {
    console.error('List applications error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch applications' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  const { company, role, jobUrl, notes, status } = req.body
  if (!company || !role) {
    return res.status(400).json({ success: false, error: 'Company and role are required' })
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' })
  }
  try {
    const application = await prisma.application.create({
      data: {
        userId: req.userId,
        company,
        role,
        jobUrl: jobUrl || null,
        notes: notes || null,
        status: status || 'Applied',
      },
    })
    res.status(201).json({ success: true, data: application })
  } catch (err) {
    console.error('Create application error:', err)
    res.status(500).json({ success: false, error: 'Failed to log application' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  const { status, notes } = req.body
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' })
  }
  try {
    const existing = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('Update application error:', err)
    res.status(500).json({ success: false, error: 'Failed to update application' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    await prisma.application.delete({ where: { id: req.params.id } })
    res.json({ success: true, data: null })
  } catch (err) {
    console.error('Delete application error:', err)
    res.status(500).json({ success: false, error: 'Failed to delete application' })
  }
})

module.exports = router
