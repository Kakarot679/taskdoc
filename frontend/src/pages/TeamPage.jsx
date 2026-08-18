import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function TeamPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchUsers = () => {
    setError('')
    api.get('/users/')
      .then(res => setUsers(res.data))
      .catch(() => setError('Unable to load team members right now.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleRole = async member => {
    const nextRole = member.role === 'admin' ? 'member' : 'admin'
    if (!window.confirm(`Make ${member.name} a${nextRole === 'admin' ? 'n' : ''} ${nextRole}?`)) return

    setUpdatingId(member.id)
    setError('')
    try {
      const { data } = await api.put(`/users/${member.id}/role`, { role: nextRole })
      setUsers(prev => prev.map(u => (u.id === member.id ? { ...u, role: data.role } : u)))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Team</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Everyone with a Taskdoc account. Admins can create projects, manage members, and assign tasks.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(member => {
            const initials = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div
                key={member.id}
                className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {member.name} {member.id === user?.id && <span className="text-slate-400 font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    member.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleToggleRole(member)}
                    disabled={updatingId === member.id}
                    className="text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                  >
                    {updatingId === member.id
                      ? 'Saving...'
                      : member.role === 'admin' ? 'Make member' : 'Make admin'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
