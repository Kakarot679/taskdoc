import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import CreateTaskModal from '../components/CreateTaskModal'
import EditTaskModal from '../components/EditTaskModal'

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

function formatDate(value) {
  if (!value) return 'No due date'
  return new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TasksPage() {
  const { user, isAdmin } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    project: 'all',
  })

  const projectById = useMemo(() => {
    return projects.reduce((map, project) => {
      map[project.id] = project
      return map
    }, {})
  }, [projects])

  const fetchPageData = async () => {
    setError('')
    setLoading(true)
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ])
      setTasks(tasksRes.data)
      setProjects(projectsRes.data)
      if (!selectedProjectId && projectsRes.data.length > 0) {
        setSelectedProjectId(String(projectsRes.data[0].id))
      }
    } catch {
      setError('Unable to load tasks right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPageData()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([])
      return
    }

    api.get(`/projects/${selectedProjectId}/members`)
      .then(res => setMembers(res.data))
      .catch(() => setMembers([]))
  }, [selectedProjectId])

  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    return tasks.filter(task => {
      const matchesSearch = !search || [
        task.title,
        task.description || '',
        task.assignee?.name || '',
        projectById[task.project_id]?.title || '',
      ].some(value => value.toLowerCase().includes(search))

      const matchesStatus = filters.status === 'all' || task.status === filters.status
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority
      const matchesProject = filters.project === 'all' || String(task.project_id) === filters.project

      return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })
  }, [tasks, filters, projectById])

  const counts = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks])

  const handleFilterChange = e => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleStatusChange = async (task, status) => {
    setActionLoading(true)
    setError('')
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status })
      setTasks(prev => prev.map(item => item.id === task.id ? data : item))
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update task status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (task) => {
    setActionLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/projects/${task.project_id}/members`)
      setMembers(data)
      setSelectedProjectId(String(task.project_id))
      setEditingTask(task)
    } catch {
      setError('Unable to load members for this task.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return

    setActionLoading(true)
    setError('')
    try {
      await api.delete(`/tasks/${task.id}`)
      setTasks(prev => prev.filter(item => item.id !== task.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete this task.')
    } finally {
      setActionLoading(false)
    }
  }

  const selectedProject = projects.find(project => String(project.id) === selectedProjectId)

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin ? 'Track work across every project.' : 'Stay on top of the work assigned to you.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {projects.length === 0 ? (
                <option value="">No projects yet</option>
              ) : (
                projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))
              )}
            </select>
            <button
              onClick={() => setShowCreateTask(true)}
              disabled={!selectedProjectId}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60"
            >
              New task
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">To do</p>
          <p className="text-2xl font-semibold text-slate-700 mt-1">{counts.todo}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">In progress</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{counts.inProgress}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Overdue</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">{counts.overdue}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            type="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search tasks"
            className="md:col-span-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-14 text-center">
          <div className="mx-auto mb-3 w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5h6m-7 4h8m-8 4h5m-7 8h10a2 2 0 002-2V7.5L14.5 4H6a2 2 0 00-2 2v13a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No tasks found</p>
          <p className="text-sm text-slate-400 mt-1">
            {tasks.length === 0 ? 'Tasks will appear here once projects start moving.' : 'Try changing the filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-white border rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between ${
                isOverdue(task) ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/projects/${task.project_id}`}
                    className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    {task.title}
                  </Link>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {isOverdue(task) && (
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      Overdue
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap mt-3 text-xs text-slate-400">
                  <span>{projectById[task.project_id]?.title || `Project #${task.project_id}`}</span>
                  <span>{formatDate(task.due_date)}</span>
                  <span>{task.assignee ? `Assigned to ${task.assignee.name}` : 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isAdmin && task.assigned_to === user?.id && (
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task, e.target.value)}
                    disabled={actionLoading}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none"
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(task)}
                      disabled={actionLoading}
                      className="text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      disabled={actionLoading}
                      className="text-xs text-red-500 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateTask && selectedProject && (
        <CreateTaskModal
          projectId={selectedProject.id}
          members={members}
          onClose={() => setShowCreateTask(false)}
          onCreated={() => {
            setShowCreateTask(false)
            fetchPageData()
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          members={members}
          onClose={() => setEditingTask(null)}
          onUpdated={() => {
            setEditingTask(null)
            fetchPageData()
          }}
        />
      )}
    </div>
  )
}
