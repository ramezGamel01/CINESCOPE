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

// After a new deploy, a tab that was already open can ask for code files that no longer
// exist. Reload once to pick up the new version instead of showing a broken page.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    try {
      const last = Number(sessionStorage.getItem("cinescope:reloadedAt") ?? 0);
      if (Date.now() - last < 10000) return;
      sessionStorage.setItem("cinescope:reloadedAt", String(Date.now()));
    } catch {
      // Without storage there is no way to tell a loop from a one-off, so leave the page as is
      return;
    }
    event.preventDefault();
    window.location.reload();
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
