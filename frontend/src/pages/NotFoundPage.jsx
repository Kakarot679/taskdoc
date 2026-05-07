import { Link, useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 9.75h.008v.008H9.75V9.75zm4.5 0h.008v.008h-.008V9.75zM9 15h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-indigo-600 mb-2">404</p>
        <h1 className="text-2xl font-semibold text-slate-800">Page not found</h1>
        <p className="text-sm text-slate-500 mt-2">
          This page may have moved, or the link might be slightly off.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/dashboard"
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go to dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
