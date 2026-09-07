import { Role } from 'core'
import { LayoutDashboard, Ticket, Users } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut, useSession } from '../lib/auth-client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground'
  }`

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
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-8 py-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-8">
        <span className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
            H
          </span>
          Helpdesk
        </span>
        <div className="flex items-center gap-1.5">
          <NavLink to="/" end className={navLinkClassName}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/tickets" className={navLinkClassName}>
            <Ticket className="h-4 w-4" />
            Tickets
          </NavLink>
          {session?.user.role === Role.admin && (
            <NavLink to="/users" className={navLinkClassName}>
              <Users className="h-4 w-4" />
              Users
            </NavLink>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3.5">
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-[13px] font-bold text-primary">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">{name}</span>
        <Button type="button" variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </nav>
  )
}

export default NavBar
