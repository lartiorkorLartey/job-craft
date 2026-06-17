import { useState, useEffect, useCallback } from 'react'
import { resumes as resumesApi } from '../api'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Upload, FileText, Trash2, Download } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Resumes() {
  const [resumeList, setResumeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    resumesApi
      .list()
      .then((res) => setResumeList(res.data.data ?? []))
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const res = await resumesApi.upload(formData)
      setResumeList((prev) => [res.data.data, ...prev])
      toast.success('Resume uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  async function deleteResume(id) {
    if (!confirm('Delete this resume? This cannot be undone.')) return
    try {
      await resumesApi.delete(id)
      setResumeList((prev) => prev.filter((r) => r.id !== id))
      toast.success('Resume deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Master Resumes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your full resume — we&apos;ll use it as the base for generating tailored versions.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-8 ${
          uploading
            ? 'opacity-50 pointer-events-none border-gray-300 bg-white'
            : isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        {uploading ? (
          <p className="text-indigo-600 font-medium">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-indigo-600 font-medium">Drop your resume here</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">Drag &amp; drop your resume here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse — PDF, DOC, DOCX supported</p>
          </>
        )}
      </div>

      {/* List */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Uploaded Resumes</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : resumeList.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No resumes uploaded yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {resumeList.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {resume.originalName || resume.filename}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatBytes(resume.size)}
                    {resume.size ? ' · ' : ''}
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {resume.url && (
                    <a
                      href={resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteResume(resume.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
