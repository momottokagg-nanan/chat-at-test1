"use client";

import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";

type Props = {
  tag: Tag;
  onClick?: (tag: Tag) => void;
};

export function TagBadge({ tag, onClick }: Props) {
  return (
    <Badge
      variant="secondary"
      className={onClick ? "cursor-pointer hover:bg-accent" : ""}
      onClick={() => onClick?.(tag)}
    >
      {tag.name}
    </Badge>
  );
}
