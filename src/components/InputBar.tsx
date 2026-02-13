"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type Props = {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
};

export function InputBar({ onSubmit, isSubmitting }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メモを入力... (Shift+Enterで改行)"
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          disabled={isSubmitting}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className="shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
