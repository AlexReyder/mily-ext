import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <div className="p-6">404</div>,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 p-4">
          <Link to="/" className="[&.active]:font-semibold">
            Home
          </Link>
          <Link to="/library" className="[&.active]:font-semibold">
            Library
          </Link>
          <Link to="/collections" className="[&.active]:font-semibold">
            Collections
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>

      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}