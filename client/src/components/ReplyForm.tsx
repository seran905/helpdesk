import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Sparkles } from 'lucide-react'
import { createReplySchema, type CreateReplyInput } from 'core'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import ErrorMessage from '@/components/ErrorMessage'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'

type ReplyFormProps = {
  ticketId: string
}

function ReplyForm({ ticketId }: ReplyFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateReplyInput>({
    resolver: zodResolver(createReplySchema),
  })

  const body = useWatch({ control, name: 'body' })

  const createReply = useMutation({
    mutationFn: (values: CreateReplyInput) =>
      apiClient.post(`/api/tickets/${ticketId}/replies`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      reset()
    },
  })

  const polishReply = useMutation({
    mutationFn: (draft: string) =>
      apiClient
        .post(`/api/tickets/${ticketId}/replies/polish`, { body: draft })
        .then((res) => res.data.body as string),
    onSuccess: (polishedBody) => {
      setValue('body', polishedBody, { shouldValidate: true, shouldDirty: true })
    },
  })

  const onSubmit = async (values: CreateReplyInput) => {
    try {
      await createReply.mutateAsync(values)
    } catch (err) {
      const message = isAxiosError<{ error?: string }>(err)
        ? (err.response?.data?.error ?? 'Failed to send reply')
        : 'Failed to send reply'
      setError('root', { message })
    }
  }

  const onPolish = async () => {
    clearErrors('root')
    try {
      await polishReply.mutateAsync(getValues('body'))
    } catch (err) {
      const message = isAxiosError<{ error?: string }>(err)
        ? (err.response?.data?.error ?? 'Failed to polish reply')
        : 'Failed to polish reply'
      setError('root', { message })
    }
  }

  return (
    <form className="flex flex-col gap-2.5 pl-9" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Textarea
        aria-label="Reply"
        placeholder="Write a reply…"
        rows={4}
        aria-invalid={errors.body && body?.trim() ? 'true' : 'false'}
        className="rounded-md border-border bg-background shadow-none"
        {...register('body')}
      />
      {errors.body && body?.trim() && <ErrorMessage>{errors.body.message}</ErrorMessage>}

      {errors.root && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
            !
          </span>
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center gap-2 self-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPolish}
          disabled={!body?.trim() || polishReply.isPending || isSubmitting}
          className="text-fuchsia-600 hover:bg-fuchsia-500/10 hover:text-fuchsia-600 dark:text-fuchsia-400"
        >
          <Sparkles />
          {polishReply.isPending ? 'Polishing…' : 'Polish'}
        </Button>
        <Button type="submit" disabled={!body?.trim() || isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </form>
  )
}

export default ReplyForm
