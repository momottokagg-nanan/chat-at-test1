"use client";

import { useEffect, useState, useCallback } from "react";
import { MemoWithTags, Tag } from "@/types";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { SearchBar } from "@/components/SearchBar";
import { ModeToggle, Mode } from "@/components/ModeToggle";
import { ImportButton } from "@/components/ImportButton";
import { BulkTagButton } from "@/components/BulkTagButton";

export default function Home() {
  const [memos, setMemos] = useState<MemoWithTags[]>([]);
  const [mode, setMode] = useState<Mode>("post");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    setHasMore(true);
    try {
      const res = await fetch("/api/memos?days=30");
      const data = await res.json();
      setMemos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch memos:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || memos.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldest = memos[0];
      const res = await fetch(
        `/api/memos?before=${encodeURIComponent(oldest.created_at)}`
      );
      const data = await res.json();
      const older: MemoWithTags[] = Array.isArray(data) ? data : [];
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setMemos((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = older.filter((m) => !existingIds.has(m.id));
          return [...unique, ...prev];
        });
      }
    } catch (e) {
      console.error("Failed to load more:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, memos]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const handlePost = async (content: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const newMemo = await res.json();
      setMemos((prev) => [...prev, newMemo]);
    } catch (e) {
      console.error("Failed to post memo:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/memos/${id}`, { method: "DELETE" });
      setMemos((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("Failed to delete memo:", e);
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMemos(Array.isArray(data) ? data : []);
      setHasMore(false); // 検索結果はページングなし
    } catch (e) {
      console.error("Failed to search:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchMemos();
  };

  const handleTagsGenerated = (memoId: string, tags: Tag[]) => {
    setMemos((prev) =>
      prev.map((m) => (m.id === memoId ? { ...m, tags } : m))
    );
  };

  const handleTagClick = (tag: Tag) => {
    setMode("search");
    handleSearch(tag.name);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "post" && searchQuery) {
      setSearchQuery("");
      fetchMemos();
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-bold">AI Chat Memo</h1>
        <div className="flex items-center gap-2">
          <BulkTagButton onCompleted={fetchMemos} />
          <ImportButton onImported={fetchMemos} />
          <ModeToggle mode={mode} onToggle={handleModeChange} />
        </div>
      </header>

      {/* Search Bar (検索モード時) */}
      {mode === "search" && (
        <div className="border-b px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isSearching={isSearching}
            />
            {searchQuery && (
              <p className="mt-2 text-xs text-muted-foreground">
                「{searchQuery}」の検索結果: {memos.length}件
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <ChatArea
        memos={memos}
        onDelete={handleDelete}
        onTagClick={handleTagClick}
        onTagsGenerated={handleTagsGenerated}
        isLoading={isLoading}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
      />

      {/* Input Bar (投稿モード時) */}
      {mode === "post" && (
        <InputBar onSubmit={handlePost} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
