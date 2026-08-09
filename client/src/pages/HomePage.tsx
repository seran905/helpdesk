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

  return (
    <div className="home-content">
      <div className="home-hero">
        <h1>Welcome, {session?.user.name}</h1>
        <p className="home-subtitle">Here's what's happening with your helpdesk today.</p>
        <span className={`status-pill${status !== 'ok' ? ` status-pill--${status}` : ''}`}>
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

export default HomePage
