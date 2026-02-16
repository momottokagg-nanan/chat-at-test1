"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Search } from "lucide-react";

export type Mode = "post" | "search";

type Props = {
  mode: Mode;
  onToggle: (mode: Mode) => void;
};

export function ModeToggle({ mode, onToggle }: Props) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 sm:gap-1 sm:p-1">
      <Button
        variant={mode === "post" ? "default" : "ghost"}
        size="sm"
        className="h-7 gap-1 px-2 text-xs sm:h-8 sm:gap-1.5 sm:px-3 sm:text-sm"
        onClick={() => onToggle("post")}
      >
        <MessageSquarePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">投稿</span>
      </Button>
      <Button
        variant={mode === "search" ? "default" : "ghost"}
        size="sm"
        className="h-7 gap-1 px-2 text-xs sm:h-8 sm:gap-1.5 sm:px-3 sm:text-sm"
        onClick={() => onToggle("search")}
      >
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">検索</span>
      </Button>
    </div>
  );
}
