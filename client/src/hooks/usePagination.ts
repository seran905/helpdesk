import { useState } from 'react'
import { DEFAULT_TICKET_PAGE_SIZE } from 'core'

export const PAGE_SIZE_OPTIONS = [10, 20, 30]

export function usePagination(
  resetKey: string,
  initialPageSize: number = DEFAULT_TICKET_PAGE_SIZE,
) {
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setPageIndex(0)
  }

  function setPageSize(size: number) {
    setPageSizeState(size)
    setPageIndex(0)
  }

  return { pageIndex, setPageIndex, pageSize, setPageSize }
}
