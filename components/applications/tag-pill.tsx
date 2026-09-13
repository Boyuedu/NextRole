"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

export function TagPill({
  name,
  onRemove,
  className,
}: {
  name: string;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-zinc-200 bg-zinc-50 font-normal text-zinc-600",
        className
      )}
    >
      {name}
      {onRemove ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200"
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
    </Badge>
  );
}
