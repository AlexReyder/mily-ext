import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Library</h1>
      <p className="text-muted-foreground">
        Saved bookmarks.
      </p>
    </div>
  );
}