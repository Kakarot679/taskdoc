import { useEffect, useState } from 'react'
import Modal from './Modal'
import api from '../services/api'

export default function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [assignableUsers, setAssignableUsers] = useState(members || [])
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    assigned_to: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    setMembersLoading(true)
    api.get('/users/')
      .then(res => setAssignableUsers(res.data))
      .catch(() => {
        if (members?.length) {
          setAssignableUsers(members)
          return
        }
        setError('Unable to load users for assignment.')
      })
      .finally(() => setMembersLoading(false))
  }, [projectId, members])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required'); return }

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim() || null,
      project_id: parseInt(projectId),
      assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
      due_date: form.due_date || null,
    }

    setLoading(true)
    try {
      await api.post('/tasks/', payload)
      onCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New task" onClose={onClose}>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Task title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="Add more detail..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due date</label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign to</label>
            <select
              name="assigned_to"
              value={form.assigned_to}
              onChange={handleChange}
              disabled={membersLoading || assignableUsers.length === 0}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">
                {membersLoading ? 'Loading users...' : assignableUsers.length === 0 ? 'No users yet' : 'Unassigned'}
              </option>
              {assignableUsers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {assignableUsers.length === 0 && !membersLoading && (
              <p className="text-xs text-slate-400 mt-1">Create another user before assigning tasks.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
