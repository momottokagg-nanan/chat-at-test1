"use client";

import { MemoWithTags, Tag } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
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
  const prevMemoCountRef = useRef<number>(0);
  const scrollActionRef = useRef<"none" | "bottom" | "restore">("none");

  // メモが変わったとき、どのスクロール操作をすべきか判定
  // (useLayoutEffect より先に実行されるよう、render中に計算)
  const memoCount = memos.length;
  const prevCount = prevMemoCountRef.current;

  if (memoCount !== prevCount) {
    if (isInitialLoad.current && memoCount > 0) {
      // 初期ロード → 最下部へ
      scrollActionRef.current = "bottom";
      isInitialLoad.current = false;
    } else if (prevScrollHeightRef.current > 0) {
      // 過去分ロード → スクロール位置維持
      scrollActionRef.current = "restore";
    } else if (memoCount > prevCount && prevCount > 0) {
      // 新規投稿（末尾に追加された）→ 最下部へ
      scrollActionRef.current = "bottom";
    } else {
      // それ以外（リフレッシュ等）→ スクロール位置を動かさない
      scrollActionRef.current = "none";
    }
    prevMemoCountRef.current = memoCount;
  }

  // 描画前にスクロール位置を調整（ちらつき防止）
  useLayoutEffect(() => {
    const action = scrollActionRef.current;
    scrollActionRef.current = "none";

    if (action === "restore" && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop +=
        newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    } else if (action === "bottom") {
      bottomRef.current?.scrollIntoView();
    }
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
