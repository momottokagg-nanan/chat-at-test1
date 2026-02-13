"use client";

import { useEffect, useState, useCallback } from "react";
import { MemoWithTags, Tag } from "@/types";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { SearchBar } from "@/components/SearchBar";
import { ModeToggle, Mode } from "@/components/ModeToggle";

export default function Home() {
  const [memos, setMemos] = useState<MemoWithTags[]>([]);
  const [mode, setMode] = useState<Mode>("post");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/memos");
      const data = await res.json();
      setMemos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch memos:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        <ModeToggle mode={mode} onToggle={handleModeChange} />
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
        isLoading={isLoading}
      />

      {/* Input Bar (投稿モード時) */}
      {mode === "post" && (
        <InputBar onSubmit={handlePost} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
