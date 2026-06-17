import { useState, useEffect, useCallback } from 'react'
import { jobs as jobsApi } from '../api'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { FileText, Trash2, ExternalLink, AlignLeft } from 'lucide-react'

const TABS = ['Paste Text', 'URL', 'Upload File']

export default function Jobs() {
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState({ title: '', text: '', url: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    jobsApi
      .list()
      .then((res) => setSavedJobs(res.data.data ?? []))
      .catch(() => toast.error('Failed to load job descriptions'))
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback((files) => setFile(files[0] ?? null), [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      if (activeTab === 0) formData.append('text', form.text)
      if (activeTab === 1) formData.append('url', form.url)
      if (activeTab === 2 && file) formData.append('file', file)

      const res = await jobsApi.create(formData)
      setSavedJobs((prev) => [res.data.data, ...prev])
      setForm({ title: '', text: '', url: '' })
      setFile(null)
      toast.success('Job description saved!')
    } catch {
      toast.error('Failed to save job description')
    } finally {
      setSaving(false)
    }
  }

  async function deleteJob(id) {
    if (!confirm('Remove this job description?')) return
    try {
      await jobsApi.delete(id)
      setSavedJobs((prev) => prev.filter((j) => j.id !== id))
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Save job descriptions to generate tailored resumes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Add Job Description</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Label</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Software Engineer at Stripe"
              />
            </div>

            {/* Tabs */}
            <div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      activeTab === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 0 && (
                <textarea
                  required
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={8}
                  placeholder="Paste the full job description here..."
                />
              )}

              {activeTab === 1 && (
                <div className="space-y-2">
                  <input
                    type="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://jobs.example.com/..."
                  />
                  <p className="text-xs text-gray-400">
                    The AI will visit this URL and extract the job description automatically.
                  </p>
                </div>
              )}

              {activeTab === 2 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <p className="text-sm text-indigo-600 font-medium">{file.name}</p>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Drop a PDF or DOCX, or click to browse</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Job Description'}
            </button>
          </form>
        </div>

        {/* Saved list */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Saved ({savedJobs.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <AlignLeft className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No job descriptions saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Added {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View original
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
