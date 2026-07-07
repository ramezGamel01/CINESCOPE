import { FilmIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <FilmIcon className="h-8 w-8" />}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
