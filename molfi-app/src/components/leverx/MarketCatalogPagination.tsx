import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalogPagination, catalogPaginationInfo } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

export const MARKETS_TABLE_PAGE_SIZE = 10;
export const MARKETS_GRID_PAGE_SIZE = 12;
/** Default page size for DataTable-backed lists (positions, orders, trades, points). */
export const DEFAULT_TABLE_PAGE_SIZE = MARKETS_TABLE_PAGE_SIZE;

export function paginateSlice<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: clampedPage,
    totalPages,
    totalItems: items.length,
  };
}

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function MarketCatalogPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: Props) {
  if (totalItems <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn(catalogPagination, className)}>
      <span className={catalogPaginationInfo}>
        {from}–{to} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="px-2 text-sm tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
