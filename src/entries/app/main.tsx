import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LibraryPage } from "@/features/library/ui/library-page";

import "@/assets/tailwind.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LibraryPage />
    </QueryClientProvider>
  </React.StrictMode>,
);