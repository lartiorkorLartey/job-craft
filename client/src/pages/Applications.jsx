import { useState, useEffect } from 'react'
import { applications as appApi } from '../api'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import { Plus, Trash2 } from 'lucide-react'

const STATUSES = [
  'Applied',
  'Phone Screen',
  'Technical Interview',
  'Onsite',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
]

const EMPTY_FORM = { company: '', role: '', jobUrl: '', notes: '', status: 'Applied' }

export default function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    appApi
      .list()
      .then((res) => setApps(res.data.data ?? []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await appApi.create(form)
      setApps((prev) => [res.data.data, ...prev])
      setShowModal(false)
      setForm(EMPTY_FORM)
      toast.success('Application logged!')
    } catch {
      toast.error('Failed to log application')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      await appApi.update(id, { status })
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function deleteApp(id) {
    if (!confirm('Remove this application?')) return
    try {
      await appApi.delete(id)
      setApps((prev) => prev.filter((a) => a.id !== id))
      toast.success('Application removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Track every opportunity you pursue</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Application
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {STATUSES.map((status) => (
          <div key={status} className="bg-white rounded-lg border border-gray-200 p-2 text-center">
            <div className="text-xl font-bold text-gray-900">
              {apps.filter((a) => a.status === status).length}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">{status}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No applications logged yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
          >
            Log your first application →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company / Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Notes
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{app.company}</div>
                    <div className="text-sm text-gray-500">{app.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="text-xs rounded-md border border-gray-200 px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                    {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate hidden md:table-cell">
                    {app.notes || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteApp(app.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Application</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    required
                    {...field('company')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    required
                    {...field('role')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job URL (optional)</label>
                  <input
                    type="url"
                    {...field('jobUrl')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    {...field('status')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                  <textarea
                    {...field('notes')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    placeholder="Recruiter name, referral, anything relevant..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
