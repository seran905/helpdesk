import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const pageSizeItems = PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: `${size} rows`,
}))

type TicketsPaginationProps = {
  pageIndex: number
  pageSize: number
  total: number
  onPageIndexChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function TicketsPagination({
  pageIndex,
  pageSize,
  total,
  onPageIndexChange,
  onPageSizeChange,
}: TicketsPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = pageIndex + 1

  const [currentPageInput, setCurrentPageInput] = useState(String(currentPage))
  const [syncedPage, setSyncedPage] = useState(currentPage)

  if (currentPage !== syncedPage) {
    setSyncedPage(currentPage)
    setCurrentPageInput(String(currentPage))
  }

  function commitCurrentPageInput() {
    const parsed = Number(currentPageInput)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > pageCount) {
      setCurrentPageInput(String(currentPage))
      return
    }
    if (parsed !== currentPage) {
      onPageIndexChange(parsed - 1)
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between">
      <Select
        items={pageSizeItems}
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger
          aria-label="Rows shown"
          className="h-8 rounded-md border border-border bg-background shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeItems.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Previous"
          disabled={pageIndex === 0}
          onClick={() => onPageIndexChange(pageIndex - 1)}
        >
          <ChevronLeft />
        </Button>
        <Input
          type="text"
          inputMode="numeric"
          value={currentPageInput}
          onChange={(e) => setCurrentPageInput(e.target.value.replace(/\D/g, ''))}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commitCurrentPageInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
          aria-label="Jump to position"
          className="h-8 w-10 rounded-md border border-border bg-background px-1 text-center shadow-none"
        />
        <span className="text-sm text-muted-foreground">of {pageCount}</span>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Next"
          disabled={currentPage >= pageCount}
          onClick={() => onPageIndexChange(pageIndex + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

export default TicketsPagination
