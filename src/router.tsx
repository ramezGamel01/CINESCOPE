import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// A page transition that gets replaced by a newer one rejects with AbortError;
// that's expected, so don't report it as an error.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { name?: string; message?: string } | undefined;
    if (reason?.name === "AbortError" && reason.message?.includes("Transition was skipped")) {
      event.preventDefault();
    }
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Smooth cross-fades between pages; posters morph into the movie page
    defaultViewTransition: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
