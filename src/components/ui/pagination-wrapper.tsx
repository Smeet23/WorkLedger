'use client'

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationWrapperProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  baseUrl?: string
  pageParamName?: string
}

export function PaginationWrapper({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  baseUrl,
  pageParamName = 'page',
}: PaginationWrapperProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Use baseUrl if provided, otherwise use current pathname
  const basePath = baseUrl || pathname

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set(pageParamName, page.toString())
    return `${basePath}?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-slate-600">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {currentPage > 1 ? (
              <Link href={createPageUrl(currentPage - 1)} passHref legacyBehavior>
                <PaginationPrevious />
              </Link>
            ) : (
              <PaginationPrevious className="pointer-events-none opacity-50" />
            )}
          </PaginationItem>

          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <Link href={createPageUrl(page)} passHref legacyBehavior>
                  <PaginationLink isActive={currentPage === page}>
                    {page}
                  </PaginationLink>
                </Link>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            {currentPage < totalPages ? (
              <Link href={createPageUrl(currentPage + 1)} passHref legacyBehavior>
                <PaginationNext />
              </Link>
            ) : (
              <PaginationNext className="pointer-events-none opacity-50" />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
