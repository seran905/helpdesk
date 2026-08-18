import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

type FetchStatus = 'pending' | 'ok' | 'error'

const roleBadgeColors: Record<string, string> = {
  admin: 'border-primary/25 bg-primary/10 text-primary',
  agent: 'border-border bg-muted text-muted-foreground',
}

function UsersPage() {
  const [status, setStatus] = useState<FetchStatus>('pending')
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/users`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setUsers(data.users)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="px-8 py-10">
      <h1 className="mb-6 text-[32px] font-semibold tracking-tight text-foreground">Users</h1>

      {status === 'pending' && <p className="text-sm text-muted-foreground">Loading users...</p>}

      {status === 'error' && <p className="text-sm text-destructive">Failed to load users.</p>}

      {status === 'ok' && users.length === 0 && (
        <p className="text-sm text-muted-foreground">No users found.</p>
      )}

      {status === 'ok' && users.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        roleBadgeColors[user.role] ?? roleBadgeColors.agent
                      }`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default UsersPage
