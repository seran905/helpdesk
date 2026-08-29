import EditUserDialog from '@/components/EditUserDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

export type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

const roleBadgeColors: Record<string, string> = {
  admin: 'border-primary/25 bg-primary/10 text-primary',
  agent: 'border-border bg-muted text-muted-foreground',
}

type UsersTableProps = {
  users: User[] | undefined
  isPending: boolean
  isError: boolean
}

function UsersTable({ users, isPending, isError }: UsersTableProps) {
  if (isPending) {
    return (
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-px">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load users.</p>
  }

  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-px">Actions</TableHead>
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
              <TableCell>
                <EditUserDialog user={user} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default UsersTable
