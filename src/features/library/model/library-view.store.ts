import { create } from "zustand";
import type { SortingState } from "@tanstack/react-table";

export type LibraryViewMode = "table" | "grid" | "creative" | "large-icons";

type LibraryViewState = {
  viewMode: LibraryViewMode;
  searchQuery: string;
  sorting: SortingState;
  pageIndex: number;
  pageSize: number;

  setViewMode: (mode: LibraryViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sorting: SortingState) => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPagination: () => void;
};

export const useLibraryViewStore = create<LibraryViewState>((set) => ({
  viewMode: "table",
  searchQuery: "",
  sorting: [{ id: "updatedAt", desc: true }],
  pageIndex: 0,
  pageSize: 12,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSorting: (sorting) => set({ sorting }),
  setPageIndex: (pageIndex) => set({ pageIndex }),
  setPageSize: (pageSize) => set({ pageSize, pageIndex: 0 }),
  resetPagination: () => set({ pageIndex: 0 }),
}));