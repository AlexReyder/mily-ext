import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Collections</h1>
      <p className="text-muted-foreground">
        Curated bookmark groups.
      </p>
    </div>
  );
}