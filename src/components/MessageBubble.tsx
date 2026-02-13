"use client";

import { MemoWithTags } from "@/types";
import { TagBadge } from "./TagBadge";
import { Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  memo: MemoWithTags;
  onDelete: (id: string) => void;
  onTagClick?: (tag: Tag) => void;
};

export function MessageBubble({ memo, onDelete, onTagClick }: Props) {
  const date = new Date(memo.created_at);
  const timeStr = date.toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex justify-end gap-2">
      <div className="max-w-[80%] space-y-1">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground">
          <p className="whitespace-pre-wrap text-sm">{memo.content}</p>
        </div>
        {memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {memo.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} onClick={onTagClick} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">{timeStr}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDelete(memo.id)}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
