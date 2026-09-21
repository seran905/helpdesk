import { ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function BackLink() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/tickets'

  return (
    <Link to={from} className="link-muted mb-6 inline-flex items-center gap-1.5 text-sm">
      <ArrowLeft className="size-4" />
      Back to tickets
    </Link>
  )
}

export default BackLink
