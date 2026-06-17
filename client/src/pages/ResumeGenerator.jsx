import { useState, useEffect } from 'react'
import { resumes as resumesApi, jobs as jobsApi, generator } from '../api'
import toast from 'react-hot-toast'
import { Wand2, CheckCircle, AlertCircle, Download } from 'lucide-react'

export default function ResumeGenerator() {
  const [resumeList, setResumeList] = useState([])
  const [jobList, setJobList] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    Promise.all([resumesApi.list(), jobsApi.list()])
      .then(([r, j]) => {
        setResumeList(r.data.data ?? [])
        setJobList(j.data.data ?? [])
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoadingData(false))
  }, [])

  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    setResult(null)
    try {
      const res = await generator.generate({ resumeId: selectedResume, jobId: selectedJob })
      setResult(res.data.data)
    } catch {
      toast.error('Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function downloadResult() {
    const blob = new Blob([result.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tailored-resume.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const canGenerate = selectedResume && selectedJob && !generating

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resume Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a tailored resume by matching your experience to a job description
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Setup</h2>

          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Master Resume
                </label>
                {resumeList.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No resumes uploaded.{' '}
                    <a href="/resumes" className="text-indigo-600 hover:underline">
                      Upload one →
                    </a>
                  </p>
                ) : (
                  <select
                    required
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select resume...</option>
                    {resumeList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.originalName || r.filename}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                {jobList.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No job descriptions saved.{' '}
                    <a href="/jobs" className="text-indigo-600 hover:underline">
                      Add one →
                    </a>
                  </p>
                ) : (
                  <select
                    required
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select job description...</option>
                    {jobList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={!canGenerate}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                {generating ? 'Generating...' : 'Generate Resume'}
              </button>
            </form>
          )}
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2">
          {generating ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Analyzing job description...</p>
              <p className="text-sm text-gray-400 mt-1">Tailoring your resume to match key requirements</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* ATS Score */}
              {result.atsScore !== undefined && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div
                    className={`text-4xl font-bold ${
                      result.atsScore >= 70
                        ? 'text-green-600'
                        : result.atsScore >= 40
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}
                  >
                    {result.atsScore}%
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">ATS Compatibility Score</p>
                    <p className="text-sm text-gray-500">
                      {result.atsScore >= 70
                        ? 'Strong match — good to go!'
                        : result.atsScore >= 40
                        ? 'Moderate match — consider the suggestions below'
                        : 'Weak match — review suggestions carefully'}
                    </p>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Suggestions</h3>
                  <div className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {s.type === 'missing' ? (
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated content */}
              {result.content && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Tailored Resume</h3>
                    <button
                      onClick={downloadResult}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {result.content}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Wand2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Ready to generate</p>
              <p className="text-sm text-gray-400 mt-1">
                Select a resume and job description on the left, then click Generate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
