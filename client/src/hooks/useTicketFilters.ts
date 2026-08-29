import { useEffect, useState } from 'react'
import { TicketCategoryFilter, TicketStatus } from 'core'

export const ALL_STATUSES = 'all'
export const ALL_CATEGORIES = 'all'

const SEARCH_DEBOUNCE_MS = 300

export function useTicketFilters() {
  const [status, setStatus] = useState<TicketStatus | typeof ALL_STATUSES>(ALL_STATUSES)
  const [category, setCategory] = useState<TicketCategoryFilter | typeof ALL_CATEGORIES>(
    ALL_CATEGORIES,
  )

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const filterParams = {
    ...(status !== ALL_STATUSES && { status }),
    ...(category !== ALL_CATEGORIES && { category }),
    ...(search && { search }),
  }

  return {
    status,
    setStatus,
    category,
    setCategory,
    searchInput,
    setSearchInput,
    filterParams,
  }
}
