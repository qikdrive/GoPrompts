"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </Button>
  );
}
