import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  MarketCatalogPagination,
  paginateSlice,
} from "@/components/leverx/MarketCatalogPagination";
import {
  dataTableMobileCard,
  dataTableMobileCardFooter,
  dataTableMobileCardHeader,
  dataTableMobileCardStats,
  dataTableMobileStack,
  dataTableMobileStatLabel,
  pageState,
} from "@/lib/leverx/tw";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  /** Omit from mobile card body (desktop-only column). */
  hideOnMobile?: boolean;
  /** Label in mobile stat grid when header is not plain text. */
  mobileLabel?: string;
  /** Primary content in the mobile card header (left). */
  mobileEmphasis?: boolean;
  /** Secondary highlight in the mobile card header (right), e.g. P&L. */
  mobileTrailing?: boolean;
  /** Full-width row at the bottom of the card, e.g. actions. */
  mobileFooter?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  /** When set, rows are paginated client-side (default 10). Pass `0` to show all rows. */
  pageSize?: number;
  /** Resets to page 1 when this value changes (e.g. tab or filter). */
  paginationKey?: string | number;
}

function columnLabel<T>(column: Column<T>): ReactNode {
  if (column.mobileLabel) return column.mobileLabel;
  if (typeof column.header === "string") return column.header;
  return column.key;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  onRowClick,
  rowClassName,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  paginationKey,
}: Props<T>) {
  const [page, setPage] = useState(1);
  const paginate = pageSize > 0 && rows.length > pageSize;

  useEffect(() => {
    setPage(1);
  }, [paginationKey]);

  const pagination = useMemo(
    () => paginateSlice(rows, page, pageSize),
    [rows, page, pageSize],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  const displayRows = paginate ? pagination.items : rows;

  if (rows.length === 0 && empty) {
    return <div className={cn(pageState, "py-8")}>{empty}</div>;
  }

  const desktopColumns = columns;

  return (
    <>
      <div className="data-table-wrap hidden overflow-x-auto overscroll-x-contain lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              {desktopColumns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-hover/50",
                  rowClassName?.(row),
                )}
              >
                {desktopColumns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={dataTableMobileStack}>
        {displayRows.map((row) => {
          const emphasis = columns.filter((c) => c.mobileEmphasis);
          const trailing = columns.filter((c) => c.mobileTrailing);
          const footer = columns.filter((c) => c.mobileFooter);
          const stats = columns.filter(
            (c) =>
              !c.mobileEmphasis &&
              !c.mobileTrailing &&
              !c.mobileFooter &&
              !c.hideOnMobile,
          );

          return (
            <article
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                dataTableMobileCard,
                onRowClick && "cursor-pointer active:bg-hover/30",
                rowClassName?.(row),
              )}
            >
              {(emphasis.length > 0 || trailing.length > 0) && (
                <div className={dataTableMobileCardHeader}>
                  <div className="min-w-0 flex-1 space-y-1">
                    {emphasis.map((c) => (
                      <div key={c.key}>{c.cell(row)}</div>
                    ))}
                  </div>
                  {trailing.length > 0 ? (
                    <div className="shrink-0 self-start text-right">
                      {trailing.map((c) => (
                        <div key={c.key}>{c.cell(row)}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {stats.length > 0 ? (
                <dl className={dataTableMobileCardStats}>
                  {stats.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-baseline justify-between gap-3 min-w-0"
                    >
                      <dt className={cn(dataTableMobileStatLabel, "shrink-0")}>
                        {columnLabel(c)}
                      </dt>
                      <dd
                        className={cn(
                          "min-w-0 text-sm text-foreground",
                          c.align === "right" && "text-right font-mono tabular-nums",
                        )}
                      >
                        {c.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {(() => {
                const footerItems = footer
                  .map((c) => ({ key: c.key, content: c.cell(row) }))
                  .filter(({ content }) => content != null && content !== false);
                if (footerItems.length === 0) return null;
                return (
                  <div className={dataTableMobileCardFooter}>
                    {footerItems.map(({ key, content }) => (
                      <div key={key} className="flex justify-end">
                        {content}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </article>
          );
        })}
      </div>

      {paginate ? (
        <MarketCatalogPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      ) : null}
    </>
  );
}
