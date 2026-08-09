import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:3001'

function App() {
  const [message, setMessage] = useState('Checking API status...')

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setMessage(`API status: ${data.status}`))
      .catch(() => setMessage('Failed to reach the API'))
  }, [])

  return (
    <div>
      <h1>Helpdesk</h1>
      <p>{message}</p>
    </div>
  )
}

export default App
