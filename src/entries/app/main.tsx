import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/assets/tailwind.css";
import { LibraryPage } from "@/features/library/ui/library-page";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LibraryPage />
    </QueryClientProvider>
  </React.StrictMode>,
);