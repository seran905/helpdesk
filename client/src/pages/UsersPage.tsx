import { useQuery } from '@tanstack/react-query'
import CreateUserDialog from '@/components/CreateUserDialog'
import UsersTable, { type User } from '@/components/UsersTable'
import { apiClient } from '@/lib/api-client'

function UsersPage() {
  const {
    data: users,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/api/users').then((res) => res.data.users as User[]),
  })

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Users</h1>
        <CreateUserDialog />
      </div>

      <UsersTable users={users} isPending={isPending} isError={isError} />
    </div>
  )
}

export default UsersPage
