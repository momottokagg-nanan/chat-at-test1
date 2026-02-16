"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sparkles, Loader2 } from "lucide-react";

interface BulkTagButtonProps {
  onCompleted: () => void;
}

export function BulkTagButton({ onCompleted }: BulkTagButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const abortRef = useRef(false);

  const runBulkTag = async () => {
    setOpen(false);
    setIsRunning(true);
    abortRef.current = false;
    let totalProcessed = 0;
    let totalFailed = 0;
    let batchCount = 0;
    let noProgressCount = 0;
    const startTime = Date.now();

    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const qs = params.toString() ? `?${params.toString()}` : "";

    try {
      while (!abortRef.current) {
        const res = await fetch(`/api/memos/generate-tags${qs}`, {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("Bulk tag generation failed:", data.error);
          break;
        }

        totalProcessed += data.processed;
        totalFailed += data.failed ?? 0;
        batchCount++;

        // 進捗がない（processed も failed も 0）場合のカウント
        if (data.processed === 0 && (data.failed ?? 0) === 0) {
          noProgressCount++;
          if (noProgressCount >= 3) {
            console.error("No progress detected after 3 consecutive batches, stopping.");
            break;
          }
        } else {
          noProgressCount = 0;
        }

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const speed = totalProcessed > 0 ? (elapsed / totalProcessed).toFixed(1) : "—";
        const failedText = totalFailed > 0 ? ` (エラー${totalFailed}件)` : "";
        setProgress(
          `${totalProcessed}件完了 / 残り${data.remaining}件 (${speed}秒/件)${failedText}`
        );

        if (data.remaining === 0) {
          break;
        }

        // 5バッチごとにメモ一覧を更新
        if (batchCount % 5 === 0) {
          onCompleted();
        }
      }

      const failedMsg = totalFailed > 0 ? `（エラー${totalFailed}件）` : "";
      if (abortRef.current) {
        alert(`中断しました（${totalProcessed}件処理済み${failedMsg}）`);
      } else if (noProgressCount >= 3) {
        alert(`処理が進まないため停止しました（${totalProcessed}件処理済み${failedMsg}）`);
      } else {
        alert(`${totalProcessed}件のメモにタグを生成しました${failedMsg}`);
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

  const handleStopClick = () => {
    abortRef.current = true;
  };

  return (
    <>
      {isRunning ? (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
          onClick={handleStopClick}
          title={`${progress}（クリックで中断）`}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-1.5 hidden sm:inline">
            {progress || "生成中..."}
          </span>
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              title="一括タグ生成"
            >
              <Sparkles className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">一括タグ</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <p className="text-sm font-medium">期間を指定して一括タグ生成</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">開始日</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">終了日</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={runBulkTag}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  実行
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  クリア
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                未指定の場合は全期間が対象です
              </p>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
