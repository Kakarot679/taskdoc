import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', email: '' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setForm({ name: user?.name || '', email: user?.email || '' })
  }, [user])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '-'

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setMessage('')
  }

  const handleCancel = () => {
    setForm({ name: user?.name || '', email: user?.email || '' })
    setEditing(false)
    setError('')
    setMessage('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name cannot be empty'); return }

    setSaving(true)
    try {
      const { data } = await api.put('/users/me', {
        name: form.name.trim(),
        email: form.email.trim(),
      })
      updateUser(data)
      setEditing(false)
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Keep your account details accurate for teammates.</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Edit profile
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center">
            {initials}
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
            {message}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Role</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              user?.role === 'admin'
                ? 'bg-indigo-50 text-indigo-600'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {user?.role}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Email</span>
            <span className="text-sm text-slate-700">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-500">Member since</span>
            <span className="text-sm text-slate-700">{joinedDate}</span>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
