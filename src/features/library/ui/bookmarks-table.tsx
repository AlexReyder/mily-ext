import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, ExternalLink, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import {
  getBookmarkOpenUrl,
  getBookmarkSecondaryText,
  getBookmarkThumbnailUrl,
} from "@/features/bookmark/model/bookmark.types";

type BookmarksTableProps = {
  data: BookmarkRecord[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: Dispatch<SetStateAction<RowSelectionState>>;
  onEdit: (bookmark: BookmarkRecord) => void;
  isBulkDeleting?: boolean;
};

const columnHelper = createColumnHelper<BookmarkRecord>();

export function BookmarksTable({
  data,
  rowSelection,
  onRowSelectionChange,
  onEdit,
  isBulkDeleting = false,
}: BookmarksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              aria-label="Select all rows on page"
              checked={table.getIsAllPageRowsSelected()}
              ref={(el) => {
                if (el) {
                  el.indeterminate =
                    table.getIsSomePageRowsSelected() &&
                    !table.getIsAllPageRowsSelected();
                }
              }}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              disabled={!table.getRowModel().rows.length || isBulkDeleting}
              className="size-4 rounded border-input"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              aria-label={`Select bookmark ${row.original.title}`}
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              disabled={isBulkDeleting}
              className="size-4 rounded border-input"
            />
          </div>
        ),
      }),

      columnHelper.accessor("title", {
        id: "bookmark",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-2 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bookmark
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const thumbnailUrl = getBookmarkThumbnailUrl(item);

          return (
            <div className="flex min-w-0 items-center gap-3">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="size-4 shrink-0 rounded-sm object-cover"
                />
              ) : (
                <div className="size-4 shrink-0 rounded-sm bg-border" />
              )}

              <div className="min-w-0">
                <div className="truncate font-medium">{item.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {getBookmarkSecondaryText(item)}
                </div>
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor("collectionId", {
        header: "Collection",
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() || "—"}</span>
        ),
      }),

      columnHelper.accessor("tags", {
        header: "Tags",
        cell: ({ getValue }) => {
          const tags = getValue();

          if (!tags.length) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 ? (
                <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                  +{tags.length - 3}
                </span>
              ) : null}
            </div>
          );
        },
      }),

      columnHelper.accessor("updatedAt", {
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-2 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(getValue()), "dd.MM.yyyy HH:mm")}
          </span>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const openUrl = getBookmarkOpenUrl(row.original);

          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3"
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>

              {openUrl ? (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Open
                  <ExternalLink className="size-4" />
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          );
        },
      }),
    ],
    [isBulkDeleting, onEdit],
  );

  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 12,
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={[
                    "border-b align-top transition",
                    row.getIsSelected() ? "bg-muted/40" : "hover:bg-muted/30",
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Bookmark пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isBulkDeleting}
          >
            Prev
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isBulkDeleting}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
