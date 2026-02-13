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
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      <Button
        variant={mode === "post" ? "default" : "ghost"}
        size="sm"
        className="gap-1.5"
        onClick={() => onToggle("post")}
      >
        <MessageSquarePlus className="h-4 w-4" />
        投稿
      </Button>
      <Button
        variant={mode === "search" ? "default" : "ghost"}
        size="sm"
        className="gap-1.5"
        onClick={() => onToggle("search")}
      >
        <Search className="h-4 w-4" />
        検索
      </Button>
    </div>
  );
}
