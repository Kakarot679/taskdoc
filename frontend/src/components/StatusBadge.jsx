const statusConfig = {
  todo: { label: 'To do', class: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In progress', class: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Completed', class: 'bg-emerald-50 text-emerald-600' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${config.class}`}>
      {config.label}
    </span>
  )
}
