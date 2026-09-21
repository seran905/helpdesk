import { Headset, ShieldCheck } from 'lucide-react'
import { Role } from 'core'
import DeleteUserDialog from '@/components/DeleteUserDialog'
import EditUserDialog from '@/components/EditUserDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  role: Role
  createdAt: string
}

const roleStyles: Record<Role, { icon: typeof Headset; className: string }> = {
  [Role.admin]: { icon: ShieldCheck, className: 'border-primary/25 bg-primary/10 text-primary' },
  [Role.agent]: {
    icon: Headset,
    className: 'border-border bg-muted text-muted-foreground',
  },
}

function initials(name: string) {
  const [first, second] = name.trim().split(/\s+/)
  return ((first?.[0] ?? '') + (second?.[0] ?? '')).toUpperCase()
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
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-px">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="even:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
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
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-px">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const role = roleStyles[user.role] ?? roleStyles[Role.agent]
            return (
              <TableRow key={user.id} className="even:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarFallback className={`text-[11px] font-semibold ${role.className}`}>
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${role.className}`}
                  >
                    <role.icon className="size-3" />
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <EditUserDialog user={user} />
                    {user.role !== Role.admin && <DeleteUserDialog user={user} />}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default UsersTable
