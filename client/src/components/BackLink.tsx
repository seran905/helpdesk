import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function BackLink() {
  return (
    <Link to="/tickets" className="link-muted mb-6 inline-flex items-center gap-1.5 text-sm">
      <ArrowLeft className="size-4" />
      Back to tickets
    </Link>
  )
}

export default BackLink
