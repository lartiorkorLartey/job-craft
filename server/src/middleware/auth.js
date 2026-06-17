const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

module.exports = requireAuth
