"use client";

import { useState } from "react";
import { MemoWithTags } from "@/types";
import { TagBadge } from "./TagBadge";
import { Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Loader2 } from "lucide-react";

type Props = {
  memo: MemoWithTags;
  onDelete: (id: string) => void;
  onTagClick?: (tag: Tag) => void;
  onTagsGenerated?: (memoId: string, tags: Tag[]) => void;
};

export function MessageBubble({
  memo,
  onDelete,
  onTagClick,
  onTagsGenerated,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const date = new Date(memo.created_at);
  const timeStr = date.toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleGenerateTags = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}/tags`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && onTagsGenerated) {
        onTagsGenerated(memo.id, data.tags);
      }
    } catch (e) {
      console.error("Failed to generate tags:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="group flex justify-end gap-2">
      <div className="max-w-[85%] space-y-1 sm:max-w-[80%]">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground sm:px-4">
          <p className="whitespace-pre-wrap text-sm">{memo.content}</p>
        </div>
        {memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {memo.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} onClick={onTagClick} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 px-1 sm:gap-2">
          <span className="text-[11px] text-muted-foreground sm:text-xs">
            {timeStr}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
            onClick={handleGenerateTags}
            disabled={isGenerating}
            title="AIでタグ生成"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Sparkles className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
            onClick={() => onDelete(memo.id)}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
