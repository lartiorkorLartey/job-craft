const router = require('express').Router()
const path = require('path')
const fs = require('fs').promises
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/auth')
const llm = require('../lib/llm')

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractResumeText(resume) {
  const filePath = path.join(__dirname, '../../uploads/resumes', resume.filename)
  const buffer = await fs.readFile(filePath)
  if (resume.mimeType === 'application/pdf') {
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text
  }
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

async function extractJobText(job) {
  if (job.text) return job.text
  if (job.filename) {
    const filePath = path.join(__dirname, '../../uploads/jobs', job.filename)
    const buffer = await fs.readFile(filePath)
    if (job.filename.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text
    }
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  if (job.url) {
    const response = await fetch(job.url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await response.text()
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50000)
  }
  return ''
}

// ─── Claude API generator ─────────────────────────────────────────────────────

// ##############################################################################
// ## MOCK GENERATOR — remove this block once ANTHROPIC_API_KEY is set in .env ##
// ##############################################################################

// Meaningful words to extract from text (skip stop words)
const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','its','may','new','now','old',
  'see','two','way','who','with','this','that','have','from','they','will','been',
  'were','said','each','which','their','time','more','also','into','than','then',
  'some','what','there','when','make','like','him','her','them','these','would',
  'other','about','your','such','after','well','over','just','know','take','good',
  'very','through','work','using','must','should','able','experience','skills',
  'strong','knowledge','excellent','team','role','job','position','candidate',
  'required','requirements','preferred','responsibilities','qualifications',
  'including','provide','ensure','support','manage','develop','maintain','help',
])

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
}

// Produces a score and suggestions purely from keyword overlap
function mockGenerate(resumeText, jdText) {
  const jdWords = new Set(extractKeywords(jdText))
  const resumeWords = new Set(extractKeywords(resumeText))

  const matches = [...jdWords].filter((w) => resumeWords.has(w))
  const missing = [...jdWords].filter((w) => !resumeWords.has(w))

  const rawScore = jdWords.size > 0 ? Math.round((matches.length / jdWords.size) * 100) : 50
  // Clamp between 15 and 92 so it never looks trivially perfect or broken
  const atsScore = Math.max(15, Math.min(92, rawScore))

  const suggestions = []

  // Top matched keywords → highlight suggestions
  matches.slice(0, 3).forEach((kw) => {
    suggestions.push({
      type: 'highlight',
      text: `Your experience with "${kw}" aligns well with this role — make sure it appears prominently near the top of your resume.`,
    })
  })

  // Top missing keywords → missing suggestions
  missing.slice(0, 4).forEach((kw) => {
    suggestions.push({
      type: 'missing',
      text: `The job description mentions "${kw}" but it doesn't appear in your resume. Add it if you have relevant experience.`,
    })
  })

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'highlight',
      text: 'Your resume covers the core requirements for this role.',
    })
  }

  // Return the resume text unchanged (no rewrite without a real model)
  const content = `[MOCK MODE — add your ANTHROPIC_API_KEY to server/.env for AI-generated content]\n\n${resumeText.trim()}`

  return { atsScore, suggestions, content }
}

// ##############################################################################
// ## END MOCK GENERATOR                                                        ##
// ##############################################################################

function buildGeneratePrompt(resumeText, jdText) {
  return `You are an expert resume writer and ATS optimization specialist.

Analyze the master resume and job description below. Return a JSON object with exactly these fields:
- "atsScore": integer 0–100 — how well the resume content aligns with the JD keywords and requirements
- "suggestions": array of objects with "type" ("highlight" or "missing") and "text" (string)
  • "highlight": a strength or experience to emphasize or reframe for this role
  • "missing": a skill, keyword, or qualification in the JD that is absent from the resume
- "content": string — the full tailored resume rewritten to target this role (plain text, well-formatted)

MASTER RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

Return ONLY valid JSON — no markdown code fences, no preamble, no explanation.`
}

async function callLLM(prompt) {
  const raw = await llm.generate(prompt)
  return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim())
}

function hasProvider() {
  return llm.detectProvider() !== null
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/generate', requireAuth, async (req, res) => {
  const { resumeId, jobId } = req.body
  if (!resumeId || !jobId) {
    return res.status(400).json({ success: false, error: 'resumeId and jobId are required' })
  }
  try {
    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId: req.userId } }),
      prisma.job.findFirst({ where: { id: jobId, userId: req.userId } }),
    ])
    if (!resume) return res.status(404).json({ success: false, error: 'Resume not found' })
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' })

    const [resumeText, jdText] = await Promise.all([
      extractResumeText(resume),
      extractJobText(job),
    ])

    if (!resumeText.trim()) {
      return res.status(422).json({ success: false, error: 'Could not extract text from resume file' })
    }
    if (!jdText.trim()) {
      return res.status(422).json({ success: false, error: 'Could not extract text from job description' })
    }

    const result = hasProvider()
      ? await callLLM(buildGeneratePrompt(resumeText, jdText))
      : mockGenerate(resumeText, jdText)

    res.json({ success: true, data: result })
  } catch (err) {
    console.error('Generate error:', err)
    res.status(500).json({ success: false, error: 'Generation failed' })
  }
})

router.post('/test-ats', requireAuth, async (req, res) => {
  const { resumeId, jobId } = req.body
  if (!resumeId || !jobId) {
    return res.status(400).json({ success: false, error: 'resumeId and jobId are required' })
  }
  try {
    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId: req.userId } }),
      prisma.job.findFirst({ where: { id: jobId, userId: req.userId } }),
    ])
    if (!resume) return res.status(404).json({ success: false, error: 'Resume not found' })
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' })

    const [resumeText, jdText] = await Promise.all([
      extractResumeText(resume),
      extractJobText(job),
    ])

    if (hasProvider()) {
      const prompt = `You are an ATS (Applicant Tracking System) simulator.

Score the resume against the job description and return a JSON object with:
- "atsScore": integer 0–100
- "feedback": array of strings — specific, actionable notes on what to improve

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

Return ONLY valid JSON — no markdown, no explanation.`

      return res.json({ success: true, data: await callLLM(prompt) })
    }

    // Mock ATS test
    const { atsScore, suggestions } = mockGenerate(resumeText, jdText)
    res.json({ success: true, data: { atsScore, feedback: suggestions.map((s) => s.text) } })
  } catch (err) {
    console.error('ATS test error:', err)
    res.status(500).json({ success: false, error: 'ATS test failed' })
  }
})

module.exports = router
