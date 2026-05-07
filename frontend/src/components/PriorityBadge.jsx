const priorityConfig = {
  low: { label: 'Low', class: 'bg-slate-50 text-slate-500' },
  medium: { label: 'Medium', class: 'bg-amber-50 text-amber-600' },
  high: { label: 'High', class: 'bg-red-50 text-red-600' },
}

export default function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || { label: priority, class: 'bg-slate-50 text-slate-500' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${config.class}`}>
      {config.label}
    </span>
  )
}
