import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { updateUserSchema, type UpdateUserInput } from 'core'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api-client'
import type { User } from '@/components/UsersTable'

type EditUserDialogProps = {
  user: User
}

function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const defaultValues: UpdateUserInput = { name: user.name, email: user.email, password: '' }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues,
  })

  const updateUser = useMutation({
    mutationFn: (values: UpdateUserInput) => apiClient.patch(`/api/users/${user.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
    },
  })

  const onSubmit = async (values: UpdateUserInput) => {
    try {
      await updateUser.mutateAsync(values)
    } catch (err) {
      const message = isAxiosError<{ error?: string }>(err)
        ? (err.response?.data?.error ?? 'Failed to update user')
        : 'Failed to update user'
      setError('root', { message })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        reset(defaultValues)
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${user.name}`}>
            <PencilIcon />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          autoComplete="off"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-name-${user.id}`}>Name</Label>
            <Input
              id={`edit-name-${user.id}`}
              autoComplete="off"
              aria-invalid={errors.name ? 'true' : 'false'}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
            <Input
              id={`edit-email-${user.id}`}
              type="email"
              autoComplete="off"
              aria-invalid={errors.email ? 'true' : 'false'}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-password-${user.id}`}>New password</Label>
            <Input
              id={`edit-password-${user.id}`}
              type="password"
              autoComplete="off"
              placeholder="Leave blank to keep the current password"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
                !
              </span>
              {errors.root.message}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserDialog
