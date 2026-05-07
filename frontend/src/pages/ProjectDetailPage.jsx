import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import CreateTaskModal from '../components/CreateTaskModal'
import EditTaskModal from '../components/EditTaskModal'
import AddMemberModal from '../components/AddMemberModal'

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setError('')
    setLoading(true)
    try {
      const projRes = await api.get(`/projects/${id}`)
      setProject(projRes.data)

      const [tasksResult, membersResult] = await Promise.allSettled([
        api.get(`/tasks/?project_id=${id}`),
        api.get(`/projects/${id}/members`),
      ])

      if (tasksResult.status === 'fulfilled') {
        setTasks(tasksResult.value.data)
      } else {
        setTasks([])
        setError('Project loaded, but tasks could not be loaded right now.')
      }

      if (membersResult.status === 'fulfilled') {
        setMembers(membersResult.value.data)
      } else {
        setMembers([])
        setError('Project loaded, but members could not be loaded right now.')
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/projects')
      } else {
        setError('Unable to load this project right now.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [id])

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.title}"? This cannot be undone.`)) return
    await api.delete(`/projects/${id}`)
    navigate('/projects')
  }

  const handleStatusChange = async (task, newStatus) => {
    await api.put(`/tasks/${task.id}`, { status: newStatus })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return
    await api.delete(`/projects/${id}/members/${userId}`)
    setMembers(prev => prev.filter(m => m.id !== userId))
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-4 bg-slate-100 rounded w-40" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    )
  }

  if (!project) return null

  const initials = project.title.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="max-w-4xl">
      {/* Project header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-800 truncate">{project.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {project.description || 'No description'} - Created by {project.creator?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowCreateTask(true)}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Task
              </button>
              <button
                onClick={() => {
                  setActiveTab('members')
                  setShowAddMember(true)
                }}
                className="text-sm text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg transition-colors"
              >
                Add member
              </button>
              <button
                onClick={handleDeleteProject}
                className="text-sm text-red-500 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-5">
        {['tasks', 'members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab} {tab === 'tasks' ? `(${tasks.length})` : `(${members.length})`}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div>
          {tasks.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <div className="mx-auto mb-3 w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5h6m-7 4h8m-8 4h5m-7 8h10a2 2 0 002-2V7.5L14.5 4H6a2 2 0 00-2 2v13a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-slate-600">No tasks yet</p>
              {isAdmin && (
                <p className="text-sm mt-1">Click "Task" above to create the first one.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { label: 'To do', list: todoTasks, color: 'text-slate-600' },
                { label: 'In progress', list: inProgressTasks, color: 'text-blue-600' },
                { label: 'Completed', list: completedTasks, color: 'text-emerald-600' },
              ].map(group => (
                group.list.length > 0 && (
                  <div key={group.label}>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${group.color}`}>
                      {group.label} ({group.list.length})
                    </h3>
                    <div className="space-y-2">
                      {group.list.map(task => (
                        <div
                          key={task.id}
                          className={`bg-white rounded-lg border p-4 flex items-start justify-between gap-3 ${
                            isOverdue(task) ? 'border-red-200' : 'border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-800">{task.title}</span>
                              {isOverdue(task) && (
                                <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <PriorityBadge priority={task.priority} />
                              {task.assignee && (
                                <span className="text-xs text-slate-400">Assigned to {task.assignee.name}</span>
                              )}
                              {task.due_date && (
                                <span className="text-xs text-slate-400">
                                  Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isAdmin && task.assigned_to === user?.id && (
                              <select
                                value={task.status}
                                onChange={e => handleStatusChange(task, e.target.value)}
                                className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 bg-white focus:outline-none"
                              >
                                <option value="todo">To do</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            )}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                + Add member
              </button>
            )}
          </div>

          <div className="space-y-2">
            {members.map(member => {
              const mi = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <div key={member.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                      {mi}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      member.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {member.role}
                    </span>
                    {isAdmin && member.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          members={members}
          onClose={() => setShowCreateTask(false)}
          onCreated={() => { setShowCreateTask(false); fetchAll() }}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          members={members}
          onClose={() => setEditingTask(null)}
          onUpdated={() => { setEditingTask(null); fetchAll() }}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          existingMembers={members}
          onClose={() => setShowAddMember(false)}
          onAdded={() => { setShowAddMember(false); fetchAll() }}
        />
      )}
    </div>
  )
}
