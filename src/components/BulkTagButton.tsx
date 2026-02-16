"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface BulkTagButtonProps {
  onCompleted: () => void;
}

export function BulkTagButton({ onCompleted }: BulkTagButtonProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/memos/generate-tags", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        console.error("Bulk tag generation failed:", data.error);
        return;
      }

      alert(`${data.processed}件のメモにタグを生成しました`);
      onCompleted();
    } catch (err) {
      console.error("Bulk tag error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isRunning}
    >
      {isRunning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      <span className="ml-1.5">{isRunning ? "生成中..." : "一括タグ"}</span>
    </Button>
  );
}
