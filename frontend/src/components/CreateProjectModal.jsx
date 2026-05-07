import { useState } from 'react'
import Modal from './Modal'
import api from '../services/api'

export default function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Project name is required'); return }
    setLoading(true)
    try {
      await api.post('/projects/', {
        title: form.title.trim(),
        description: form.description.trim() || null,
      })
      onCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Project name</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Website Redesign"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What's this project about?"
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
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
            {loading ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
