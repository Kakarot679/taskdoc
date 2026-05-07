import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${icon.className}`}>
          {icon.label}
        </div>
      </div>
    </div>
  )
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setError('Unable to load dashboard stats right now.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening across your projects.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total tasks" value={stats?.total_tasks ?? 0} color="text-slate-800" icon={{ label: 'All', className: 'bg-slate-100 text-slate-600' }} />
        <StatCard label="Completed" value={stats?.completed ?? 0} color="text-emerald-600" icon={{ label: 'Done', className: 'bg-emerald-50 text-emerald-600' }} />
        <StatCard label="In progress" value={stats?.in_progress ?? 0} color="text-blue-600" icon={{ label: 'Now', className: 'bg-blue-50 text-blue-600' }} />
        <StatCard label="Overdue" value={stats?.overdue ?? 0} color="text-red-600" icon={{ label: 'Late', className: 'bg-red-50 text-red-600' }} />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Projects" value={stats?.total_projects ?? 0} color="text-indigo-600" icon={{ label: 'Prj', className: 'bg-indigo-50 text-indigo-600' }} />
          <StatCard label="Team members" value={stats?.total_members ?? 0} color="text-violet-600" icon={{ label: 'Team', className: 'bg-violet-50 text-violet-600' }} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent tasks</h2>
          {stats?.recent_tasks?.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recent_tasks?.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate font-medium">{task.title}</p>
                    {isOverdue(task) && (
                      <span className="text-xs text-red-500 font-medium">Overdue</span>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Upcoming deadlines</h2>
          {stats?.upcoming_deadlines?.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {stats?.upcoming_deadlines?.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate font-medium">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/projects"
          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          View all projects
        </Link>
      </div>
    </div>
  )
}
