"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface BulkTagButtonProps {
  onCompleted: () => void;
}

export function BulkTagButton({ onCompleted }: BulkTagButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState("");

  const handleClick = async () => {
    setIsRunning(true);
    let totalProcessed = 0;

    try {
      // バッチを繰り返し呼び出す
      while (true) {
        const res = await fetch("/api/memos/generate-tags", {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("Bulk tag generation failed:", data.error);
          break;
        }

        totalProcessed += data.processed;
        setProgress(`${totalProcessed}件完了 / 残り${data.remaining}件`);

        if (data.remaining === 0) {
          break;
        }

        // メモ一覧を途中で更新
        onCompleted();
      }

      alert(`${totalProcessed}件のメモにタグを生成しました`);
      onCompleted();
    } catch (err) {
      console.error("Bulk tag error:", err);
    } finally {
      setIsRunning(false);
      setProgress("");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
      onClick={handleClick}
      disabled={isRunning}
      title={isRunning ? progress : "一括タグ生成"}
    >
      {isRunning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      <span className="ml-1.5 hidden sm:inline">
        {isRunning ? progress || "生成中..." : "一括タグ"}
      </span>
    </Button>
  );
}
