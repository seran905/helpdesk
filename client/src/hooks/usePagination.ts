import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_TICKET_PAGE_SIZE } from 'core'

export const PAGE_SIZE_OPTIONS = [10, 20, 30]

export function usePagination(
  resetKey: string,
  initialPageSize: number = DEFAULT_TICKET_PAGE_SIZE,
) {
  const [searchParams, setSearchParams] = useSearchParams()
  const prevResetKey = useRef(resetKey)

  const pageIndex = Math.max(0, Number(searchParams.get('page') ?? '1') - 1)
  const pageSize = Number(searchParams.get('pageSize') ?? initialPageSize)

  // Reset to page 1 when filters/sorting change, but not on initial mount
  // (e.g. when the page index was just restored from the URL by browser back navigation).
  useEffect(() => {
    if (resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('page', '1')
          return next
        },
        { replace: true },
      )
    }
  }, [resetKey, setSearchParams])

  function setPageIndex(index: number) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(index + 1))
        return next
      },
      { replace: true },
    )
  }

  function setPageSize(size: number) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('pageSize', String(size))
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
  }

  return { pageIndex, setPageIndex, pageSize, setPageSize }
}
