"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface BulkTagButtonProps {
  onCompleted: () => void;
}

export function BulkTagButton({ onCompleted }: BulkTagButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const abortRef = useRef(false);

  const handleClick = async () => {
    if (isRunning) {
      // 実行中なら中断
      abortRef.current = true;
      return;
    }

    setIsRunning(true);
    abortRef.current = false;
    let totalProcessed = 0;
    let batchCount = 0;
    const startTime = Date.now();

    try {
      while (!abortRef.current) {
        const res = await fetch("/api/memos/generate-tags", {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("Bulk tag generation failed:", data.error);
          break;
        }

        totalProcessed += data.processed;
        batchCount++;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const speed = totalProcessed > 0 ? (elapsed / totalProcessed).toFixed(1) : "—";
        setProgress(
          `${totalProcessed}件完了 / 残り${data.remaining}件 (${speed}秒/件)`
        );

        if (data.remaining === 0) {
          break;
        }

        // 5バッチごとにメモ一覧を更新（頻繁な更新を避ける）
        if (batchCount % 5 === 0) {
          onCompleted();
        }
      }

      if (abortRef.current) {
        alert(`中断しました（${totalProcessed}件処理済み）`);
      } else {
        alert(`${totalProcessed}件のメモにタグを生成しました`);
      }
      onCompleted();
    } catch (err) {
      console.error("Bulk tag error:", err);
      alert("エラーが発生しました。コンソールを確認してください。");
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
      disabled={false}
      title={isRunning ? `${progress}（クリックで中断）` : "一括タグ生成"}
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
