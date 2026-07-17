"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

export function DomainBookmarkCard({
  title,
  url,
  description,
  copyable = true
}: {
  title: string;
  url: string;
  description: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="font-bold text-navy-900">{title}</p>
      <p className="break-all font-mono text-xs text-slate-600 sm:text-sm">{url}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      {copyable && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={handleCopy} className="btn-secondary px-2 py-1 text-xs">
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? "Tersalin" : "Salin link"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-2 py-1 text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Buka
          </a>
        </div>
      )}
    </div>
  );
}
