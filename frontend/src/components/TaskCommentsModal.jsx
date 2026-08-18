import { useEffect, useState } from 'react'
import Modal from './Modal'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function formatTimestamp(value) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function TaskCommentsModal({ task, onClose }) {
  const { user, isAdmin } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  const fetchComments = () => {
    setError('')
    api.get(`/tasks/${task.id}/comments/`)
      .then(res => setComments(res.data))
      .catch(() => setError('Unable to load comments right now.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchComments()
  }, [task.id])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!body.trim()) return

    setPosting(true)
    setError('')
    try {
      await api.post(`/tasks/${task.id}/comments/`, { body: body.trim() })
      setBody('')
      fetchComments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async commentId => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await api.delete(`/tasks/${task.id}/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete comment')
    }
  }

  return (
    <Modal title={`Comments · ${task.title}`} onClose={onClose}>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto space-y-3 mb-4 -mr-1 pr-1">
        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-slate-50 rounded-lg px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-700">{comment.author.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{formatTimestamp(comment.created_at)}</span>
                </div>
                {(isAdmin || comment.user_id === user?.id) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap break-words">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          maxLength={2000}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 shrink-0"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </Modal>
  )
}
