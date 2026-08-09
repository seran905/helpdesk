import { useNavigate } from 'react-router-dom'
import { signOut, useSession } from '../lib/auth-client'

function NavBar() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => navigate('/login', { replace: true }),
      },
    })
  }

  const name = session?.user.name ?? ''
  const initial = name.charAt(0).toUpperCase()

  return (
    <nav className="nav-bar">
      <span className="nav-brand">
        <span className="nav-logo">H</span>
        Helpdesk
      </span>
      <div className="nav-user">
        <span className="nav-avatar">{initial}</span>
        <span className="nav-user-name">{name}</span>
        <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

export default NavBar
