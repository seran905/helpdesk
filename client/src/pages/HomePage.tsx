import { useEffect, useState } from 'react'
import { useSession } from '../lib/auth-client'

const API_URL = 'http://localhost:3001'

type ApiStatus = 'pending' | 'ok' | 'error'

function HomePage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<ApiStatus>('pending')

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setStatus('error'))
  }, [])

  const statusLabel = {
    pending: 'Checking API status...',
    ok: 'All systems operational',
    error: 'Failed to reach the API',
  }[status]

  const statusColors = {
    pending: 'border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    ok: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    error: 'border-red-500/25 bg-red-500/10 text-red-500',
  }[status]

  return (
    <div className="flex flex-grow flex-col items-center px-6 py-24">
      <div className="max-w-[480px] text-center">
        <h1 className="text-[32px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome, {session?.user.name}
        </h1>
        <p className="mt-2.5 mb-6 text-[15px] text-zinc-400">
          Here's what's happening with your helpdesk today.
        </p>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${statusColors}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

export default HomePage
