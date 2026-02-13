"use client";

import { MemoWithTags, Tag } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

type Props = {
  memos: MemoWithTags[];
  onDelete: (id: string) => void;
  onTagClick?: (tag: Tag) => void;
  isLoading?: boolean;
};

export function ChatArea({ memos, onDelete, onTagClick, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [memos]);

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="mx-auto max-w-2xl space-y-4 py-4">
        {memos.length === 0 && !isLoading && (
          <p className="text-center text-sm text-muted-foreground">
            メモがありません。下の入力欄から投稿してみましょう。
          </p>
        )}
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">
            読み込み中...
          </p>
        )}
        {memos.map((memo) => (
          <MessageBubble
            key={memo.id}
            memo={memo}
            onDelete={onDelete}
            onTagClick={onTagClick}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
