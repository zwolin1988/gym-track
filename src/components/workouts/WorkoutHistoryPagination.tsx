/**
 * WorkoutHistoryPagination Component
 *
 * Pagination controls for navigating between workout pages.
 * Shows current page, total pages, and previous/next buttons.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkoutHistoryPaginationProps } from "./types";

export function WorkoutHistoryPagination({ pagination }: WorkoutHistoryPaginationProps) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) {
    return null;
  }

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    return `${window.location.pathname}?${params.toString()}`;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button variant="outline" disabled={page === 1} asChild={page > 1}>
        {page > 1 ? (
          <a href={buildPageUrl(page - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Poprzednia
          </a>
        ) : (
          <span>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Poprzednia
          </span>
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        Strona <span className="font-semibold">{page}</span> z <span className="font-semibold">{total_pages}</span>
      </span>

      <Button variant="outline" disabled={page === total_pages} asChild={page < total_pages}>
        {page < total_pages ? (
          <a href={buildPageUrl(page + 1)}>
            Nastpna
            <ChevronRight className="ml-1 h-4 w-4" />
          </a>
        ) : (
          <span>
            Nastpna
            <ChevronRight className="ml-1 h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
