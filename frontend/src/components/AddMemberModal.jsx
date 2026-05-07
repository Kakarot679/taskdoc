import { useState, useEffect } from 'react'
import Modal from './Modal'
import api from '../services/api'

export default function AddMemberModal({ projectId, existingMembers, onClose, onAdded }) {
  const [allUsers, setAllUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    api.get('/users/').then(res => {
      const existingIds = new Set(existingMembers.map(m => m.id))
      setAllUsers(res.data.filter(u => !existingIds.has(u.id)))
    }).catch(() => {
      setError('Unable to load users right now.')
    }).finally(() => setUsersLoading(false))
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!selectedId) { setError('Please select a user'); return }
    setLoading(true)
    try {
      await api.post(`/projects/${projectId}/members`, { user_id: parseInt(selectedId) })
      onAdded()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add member" onClose={onClose}>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select user</label>
          {usersLoading ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : allUsers.length === 0 ? (
            <p className="text-sm text-slate-400">All registered users are already in this project.</p>
          ) : (
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setError('') }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a user...</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            Cancel
          </button>
          {allUsers.length > 0 && !usersLoading && (
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
              {loading ? 'Adding...' : 'Add member'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
