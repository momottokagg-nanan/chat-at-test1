"use client";

import { MemoWithTags, Tag } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  memos: MemoWithTags[];
  onDelete: (id: string) => void;
  onTagClick?: (tag: Tag) => void;
  onTagsGenerated?: (memoId: string, tags: Tag[]) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
};

export function ChatArea({
  memos,
  onDelete,
  onTagClick,
  onTagsGenerated,
  isLoading,
  onLoadMore,
  isLoadingMore,
  hasMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isInitialLoad = useRef(true);

  // 初期ロード時・新規投稿時に最下部へスクロール
  useEffect(() => {
    if (isInitialLoad.current && memos.length > 0) {
      bottomRef.current?.scrollIntoView();
      isInitialLoad.current = false;
      return;
    }
    // 過去分ロード後はスクロール位置を維持
    if (prevScrollHeightRef.current > 0 && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop +=
        newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
      return;
    }
    // 新規投稿時は最下部へ
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [memos]);

  // 上スクロールで過去分を読み込み
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !onLoadMore || isLoadingMore || !hasMore) return;

    if (el.scrollTop < 100) {
      prevScrollHeightRef.current = el.scrollHeight;
      onLoadMore();
    }
  }, [onLoadMore, isLoadingMore, hasMore]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4">
      <div className="mx-auto max-w-2xl space-y-4 py-4">
        {/* 過去分ローディング */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {hasMore === false && memos.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            すべてのメモを表示しています
          </p>
        )}
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
            onTagsGenerated={onTagsGenerated}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
