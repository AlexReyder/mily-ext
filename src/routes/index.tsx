import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="text-muted-foreground">
        Extension app shell.
      </p>
    </div>
  );
}