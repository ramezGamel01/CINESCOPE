import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@/hooks/useDebounce";

interface Props {
  initialValue?: string;
  autoNavigate?: boolean;
  large?: boolean;
}

export function SearchBar({ initialValue = "", autoNavigate = true, large }: Props) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebounce(value, 500);
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoNavigate) return;
    const q = debounced.trim();
    if (q.length >= 2) {
      navigate({ to: "/search/$query", params: { query: q } });
    }
  }, [debounced, autoNavigate, navigate]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) navigate({ to: "/search/$query", params: { query: q } });
      }}
      className="relative w-full"
    >
      <Search
        className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground ${large ? "h-6 w-6" : "h-5 w-5"}`}
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for a movie..."
        className={`w-full rounded-full border border-border bg-card/70 pl-14 pr-32 outline-none backdrop-blur-md transition focus:border-primary focus:ring-4 focus:ring-primary/20 ${
          large ? "py-5 text-lg shadow-poster" : "py-3 text-base"
        }`}
      />
      <button
        type="submit"
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition hover:brightness-110 ${
          large ? "py-3" : "py-1.5 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
