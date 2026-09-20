import type { ReactNode } from 'react'

type ErrorMessageProps = {
  children: ReactNode
}

function ErrorMessage({ children }: ErrorMessageProps) {
  return <p className="text-xs text-destructive">{children}</p>
}

export default ErrorMessage
