import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applications, resumes, jobs } from '../api'
import { Upload, Briefcase, FileCheck, ClipboardList, ArrowRight } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ applications: 0, resumes: 0, jobs: 0, activeInterviews: 0 })
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([applications.list(), resumes.list(), jobs.list()])
      .then(([appRes, resumeRes, jobRes]) => {
        const apps = appRes.data.data ?? []
        setStats({
          applications: apps.length,
          resumes: resumeRes.data.data?.length ?? 0,
          jobs: jobRes.data.data?.length ?? 0,
          activeInterviews: apps.filter((a) =>
            ['Phone Screen', 'Technical Interview', 'Onsite'].includes(a.status)
          ).length,
        })
        setRecentApps(apps.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Applications', value: stats.applications, icon: ClipboardList, color: 'bg-blue-50 text-blue-600', href: '/applications' },
    { label: 'Active Interviews', value: stats.activeInterviews, icon: Briefcase, color: 'bg-amber-50 text-amber-600', href: '/applications' },
    { label: 'Resumes', value: stats.resumes, icon: FileCheck, color: 'bg-green-50 text-green-600', href: '/resumes' },
    { label: 'Job Descriptions', value: stats.jobs, icon: Upload, color: 'bg-purple-50 text-purple-600', href: '/jobs' },
  ]

  const quickActions = [
    { to: '/resumes', icon: Upload, color: 'bg-indigo-50', iconColor: 'text-indigo-600', label: 'Upload Resume', sub: 'Add your master resume' },
    { to: '/jobs', icon: Briefcase, color: 'bg-amber-50', iconColor: 'text-amber-600', label: 'Add Job Description', sub: 'Paste, link, or upload a JD' },
    { to: '/applications', icon: ClipboardList, color: 'bg-green-50', iconColor: 'text-green-600', label: 'Log Application', sub: 'Track a new application' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s an overview of your job search progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition-colors"
          >
            <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors group"
            >
              <div className={`h-9 w-9 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                <action.icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-400 truncate">{action.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/applications" className="text-sm text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : recentApps.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">No applications yet.</p>
            <Link to="/applications" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
              Log your first application →
            </Link>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900">{app.company}</div>
                      <div className="text-xs text-gray-500">{app.role}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
