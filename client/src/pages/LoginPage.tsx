import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { signIn } from '../lib/auth-client'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async ({ email, password }: LoginFormValues) => {
    try {
      const { error: signInError } = await signIn.email({ email, password })

      if (signInError) {
        setError('root', { message: signInError.message ?? 'Failed to sign in' })
        return
      }

      navigate('/', { replace: true })
    } catch {
      setError('root', { message: 'Failed to reach the server' })
    }
  }

  return (
    <div className="flex flex-grow items-center justify-center bg-gradient-to-br from-purple-50 to-white p-6 dark:from-zinc-950 dark:to-zinc-900">
      <form
        className="w-[380px] max-w-full rounded-3xl border border-zinc-200 bg-white p-9 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-xl font-bold text-white shadow-sm">
          H
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome back
        </h1>
        <p className="mt-1.5 mb-7 text-center text-sm text-zinc-400">Sign in to your Helpdesk account</p>

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-900 focus:border-purple-500 focus:ring-3 focus:ring-purple-500/10 focus:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-900 focus:border-purple-500 focus:ring-3 focus:ring-purple-500/10 focus:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {errors.root && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-500">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
              !
            </span>
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
