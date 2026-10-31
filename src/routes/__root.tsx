import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { motionBootScript } from "@/hooks/useMotion";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-7xl text-primary">404</h1>
      <p className="mt-2 text-muted-foreground">This scene doesn't exist.</p>
      <a
        href="/"
        className="mt-6 rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground"
      >
        Back to home
      </a>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">This page didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-border bg-card px-5 py-2 font-medium"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CineScope — Discover Movies" },
      {
        name: "description",
        content:
          "Search, discover, and save your favorite movies. Browse trending films with CineScope.",
      },
      { property: "og:title", content: "CineScope — Discover Movies" },
      {
        property: "og:description",
        content: "Search movies, view details, and save favorites.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CineScope — Discover Movies" },
      { name: "description", content: "Search, discover, and save your favorite movies. Browse trending films with CineScope." },
      { property: "og:description", content: "Search, discover, and save your favorite movies. Browse trending films with CineScope." },
      { name: "twitter:description", content: "Search, discover, and save your favorite movies. Browse trending films with CineScope." },
      { property: "og:image", content: "https://cinescope-gamma-ruby.vercel.app/og-image.jpg" },
      { name: "twitter:image", content: "https://cinescope-gamma-ruby.vercel.app/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [{ children: motionBootScript }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
