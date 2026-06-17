const STATUS_CONFIG = {
  Applied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Phone Screen': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Technical Interview': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  Onsite: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Offer: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Withdrawn: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Applied']
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}
