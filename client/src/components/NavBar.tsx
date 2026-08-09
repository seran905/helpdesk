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
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/85 px-8 py-3.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/85">
      <span className="flex items-center gap-2.5 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-[13px] font-bold text-white">
          H
        </span>
        Helpdesk
      </span>
      <div className="flex items-center gap-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-[13px] font-bold text-purple-600 dark:bg-purple-400/15 dark:text-purple-400">
          {initial}
        </span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}

export default NavBar
